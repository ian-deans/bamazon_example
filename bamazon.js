// Import the connection object from db.js
const db = require("./db");
const inquirer = require("inquirer");

// QUERY STRINGS
const GET_ALL_ITEMS = "select * from items";
const GET_ITEM = id => `select * from items where id=${id}`;
const UPDATE_ITEM_STOCK = (id, quantity) => `update items set stock=stock - ${quantity} where id=${id}`;


// Variables
let items = [];
let order = {
  items: [],
  total_price: 0,
};
let userFunds = 125;

// Colors for use in console.log
const colors = {
  RESET: "\x1b[0m",
  YELLOW: "\x1b[33m",
  CYAN: "\x1b[36m",
  BLACK: "\x1b[30m",
  GREEN: "\x1b[32m",
  BLUE: "\x1b[34m",
  RED: "\x1b[31m",
  WHITE: "\x1b[37m",

  bg: {
    WHITE: "\x1b[47m",
    CYAN: "\x1b[46m",
  }
};

// Main Loop, this starts the program.
main();




/**
 * MAIN FUNCTION
 * 
 * This is where the overall order of operations is maintained. Here I used
 * the async/await syntax to help with readability.  
 *  
 */

async function main() {
  printTitleScreen();
  await getItemsFromDB();
  await phaseAddItems();
  await phaseProcessOrder();
}

/**
 * PHASE FUNCTIONS
 * 
 * These functions contain the steps performed in each
 * phase of the program lifespan.
 * 
 * Abstr
 */

async function phaseAddItems() {
  let addingItems = true;

  while(addingItems) {
    await promptForItem()
      .then(addItemToOrder);

    printOrder();
    addingItems = (await promptIfAddingMoreItems()).continue;
  }
  return;  
};

async function phaseProcessOrder() {
  printCart();
  const userConfirmed = (await promptUserToConfirmOrder()).confirm

  if (userConfirmed) {   
    try {
      await updateOrderedItems(order.items);
      console.log("Order Completed")
    } catch (error) {
      console.error(error);
    }

  } else {
    console.log('Order Cancelled')
  }
  shutdown();
}



/**
 * PROMPT FUNCTIONS
 * 
 * These functions will return a promise created by invoking inquirer.prompt()
 * which will allow them to be used with either async/await or .then()/.catch() syntax
 * 
 * ex. 
 *     const item = await promptForItem()
 *     console.log(item)
 *     
 *     promptForItem().then( item => console.log(item) )
 */

function promptForItem() {
  return inquirer.prompt([
    {
      type: 'list',
      name: 'id',
      message: 'Select an item from below:',
      choices: createItemChoices,
    },
    {
      type: 'number',
      name: 'quantity',
      message: answers => {
        const stockAvailable = findItemById(answers.id).stock;
        return `How many would you like to buy? (${stockAvailable} available)`;
      },
      validate: (userInput, answers) => {
        if(isNaN(userInput)) {
          return false;
        }
        const stockAvailable = findItemById(answers.id).stock;
        return userInput > 0 && stockAvailable >= userInput;
      },
    }
  ])
}

function promptIfAddingMoreItems() {
  return inquirer.prompt({
      message: 'Add more items?',
      type: 'confirm',
      name: 'continue',
    })
};

function promptUserToConfirmOrder() {
  return inquirer.prompt({
    message: 'Proceed with purchase?',
    type: 'confirm',
    name: 'confirm',
  })
}



/**
 * DATABASE FUNCTIONS
 * 
 * Since the mysql npm module uses callbacks instead of promises we need to wrap 
 * these functions in Promises manually to make them easier to use and make
 * function usage more consistant throughout our code.
 * 
 * These functions will return a new Promise which contains a function that
 * querries the database in some way and invokes the resolve callback function if it
 * successfully gets the data back; or it will invoke the reject callback function if
 * it receives an error fromt the database.
 * 
 * ex.
 *    const itemsFromDB = await getItemsFromDB();
 * 
 *    getItemsFromDB
 *      .then( items => console.log(items) )
 *      .catch( error => console.error(error) )
 */


function getItemsFromDB() {
  return new Promise(function(resolve, reject) {
    db.query(GET_ALL_ITEMS, (error, data) => {

      // Handle the error if there is one
      if (error) {
        console.error(error);
        return reject();
      }
  
      // If no error, set items locally
      items = data;
      return resolve()
    })
  })
};

function updateItemStock(id, quantity) {
  return new Promise(function(resolve, reject) {
    db.query(UPDATE_ITEM_STOCK(id, quantity), (error, data) => {
      if (error) {
        console.error(error);
        return reject();
      }
      return resolve()
    })
  })
}






/**
 * UTILITY FUNCTIONS
 * 
 * Helper functions, some generic some specific.
 * 
 * Abstracted out to stay in line with the Single Purpose Principle and D.R.Y.
 * as well as to increase code readability.
 */

function addItemToOrder(item) {
  const selected = findItemById(item.id);
  item.cost = selected.price * item.quantity
  order.items.push(item);
  order.total_price = parseInt(order.total_price) + parseInt(item.cost)
}

function createItemChoices() {
  const choices = items.map(item => {
    return {
      name: item.name,
      short: item.name,
      value: item.id,
    }
  })
  return choices;
}

function findItemById(id) {
  return items.find(item => item.id === id);
}



function printCart() {

  const BAR = `${colors.bg.CYAN}                              ${colors.RESET}`;
  const TITLE = `${colors.bg.CYAN}${colors.WHITE}        Purchase Items        ${colors.RESET}`;
  const FOOTER = `Total Price: ${colors.GREEN} $${order.total_price} ${colors.RESET}`;
  
  const orderBreakdown = processOrderItems();

  console.log(BAR);
  console.log(TITLE)
  console.log(BAR);
  console.table(orderBreakdown);
  console.log(FOOTER);
}

function printTitleScreen() {
  const BAR = colors.bg.WHITE + "                    " + colors.RESET;
  const TITLE = colors.bg.WHITE + colors.BLACK + "    Bamazon App     " + colors.RESET;

  console.log(BAR);
  console.log(TITLE);
  console.log(BAR);
}

function printOrder() {
  const BAR = colors.bg.CYAN + colors.WHITE + "                     " + colors.RESET;
  const TITLE = colors.bg.CYAN + colors.WHITE + "        Order        " + colors.RESET;

  console.log(BAR)
  console.log(TITLE)
  console.log(BAR)
  console.table(processOrderItems());
};

function processOrderItems() {
  return order.items.map(orderItem => {
    const {id, quantity} = orderItem
    const {name, price} =  items.find(item => item.id === id);
    const cost = parseInt(price) * parseInt(quantity);
  
    return { name, price, quantity, cost };
  })
}

function shutdown() {
  db.end()
  process.exit()
}

// This function uses Promise.alll() to wait for multiple Promises to resolve.
function updateOrderedItems(itemArray) {
  return Promise.all([
    itemArray.map(item => updateItemStock(item.id, item.quantity))
  ]);
}
