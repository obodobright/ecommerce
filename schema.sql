-- STEPS

-- mysql -u root -p
-- show database;

-- to create a database wewill use
CREATE DATABASE notes_app
-- to change and switch db directory, we use

USE notes_app;

-- CREATE A TABLE CALLED note IN THER NOTES_APP DB

CREATE TABLE note (
    id interger PRIMARY KEY AUTO_INCREMENT
    title VARCHAR(754) NOT NULLABLE
    contents VARCHAR(754) NOT NULLABLE
    createdAt 
)



-- SELECT STATEMENT
-- This is used to extract all data from the database, you extract all the columns in the data or some columns in the data

-- to select all fields => note here is the table you are selecting in the db
SELECT * FROM note;

-- to select from individual colum use,

SELECT CustomerName, ContactName, PostalCode FROM Customers;

-- use select distint to select distint data wirthut showing duplicates

SELECT DISTINCT CusstomerName FROM Customers;

-- the where statement=> this statment acts like a filter, in such a way that, it returns conditional results based on the inputs

SELECT * FROM Customers WHERE City = 'Berlin'
SELECT * FROM Customers WHERE CustomerName = 'Aisha';
SELECT PostalCode FROM Customers WHERE PostalCode = '201eb';

SELECT * FROM CUSTOMERS WHERE CustomerId = 20;
SELECT * FROM Customers WHERE Age >= 18;
SELECT * FROM Customers WHERE Country != 'England';

-- the AND CONDITION => THIS RETURNS RESULTOS IF ALL CONDITIONS ARE TRUE AND IT'S 
-- ALWAYS ACCOMPANIED WITH WHERE 
-- FOR EXAMPLE

SELECT * FROM Customers WHERE City ='Lagos' AND Country = 'Nigeria'
SELECT * FROM Customers WHERE PostalCode != '2301' AND City != 'Lagos';

-- OR STATEMENT
SELECT * FROM Customers WHERE City = 'Lagos' OR Country = 'Malawi';
SELECT * FROM Customers WHERE PostalCode <> '8UWU' OR WEATHER ='Sunny'

-- NOT STATEMENT -  WHERE CONDITION IS NOT TRUE
SELECT * FROM Customers WHERE NOT City = 'Lagos';
SELECT * FROM Customers WHERE NOT Country = 'GHANA';

