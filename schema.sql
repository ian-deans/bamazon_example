use bamazon;

DROP TABLE IF EXISTS items;
CREATE TABLE items(
	id serial primary key,
    name varchar(20) not null,
    price int,
    stock int
);

insert into items (name, price, stock) values ("Strawberries", 5, 100);
insert into items (name, price, stock) values ("Lemons", 6, 100);
insert into items (name, price, stock) values ("Mangos", 6, 100);
insert into items (name, price, stock) values ("Peaches", 2, 100);
insert into items (name, price, stock) values ("Apples", 2, 100);
insert into items (name, price, stock) values ("Oranges", 3, 100);
insert into items (name, price, stock) values ("Pears", 3, 100);