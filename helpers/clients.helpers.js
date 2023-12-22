const { client } = require("../prisma");
const { findUnique, create, findMany } = client;
const { price, upfront, interest, ufvalue } = require("../params"); // Change params in params.js to try different scenarios

const findClient = async (id) => { // find specific client by id, getting all his information 
    try {
        const clientId = parseInt(id);
        const correctClient = await findUnique({ // Use Prisma's findUnique method to retrieve specific client
            where: {
                id: clientId,
            },
            include: {          // If we don't use include it won't show the relational objects on messages and debts
                messages: true,
                debts: true,
            }
        });

        return correctClient;
    } catch (err) {
        console.log(err);
        throw err;
    }
};

const createClient = async (input) => { // create a client with his messages and debts, id is generated automatically
    try {
        const { name, rut, salary, savings, messages, debts } = input;

        // Create the parent model
        const createdClient = await create({
            data: {
                name,
                rut,
                salary,
                savings,
                messages: {
                    create: messages,   // Creating children items associated with the parent
                },
                debts: {
                    create: debts,      // Creating children items associated with the parent
                }
            },
            include: {
                messages: true,
                debts: true,
            },
        });

        return createdClient;
    } catch (err) {
        console.log(err);
        throw err;
    }
};


const findAllClients = async () => {
    try {
        const allClients = await findMany(); // Use Prisma's findMany method to retrieve all items

        return allClients;
    } catch (err) {
        console.log(err);
        throw err;
    }
};

const findFollowUp = async () => {
    try {
        // Calculate the date one week ago from the current date
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        // Query the database to find users whose most recent message's timestamp is more than a week ago
        const clientLatestMessage = await findMany({
            include: {
                messages: {
                    orderBy: {
                        sentAt: 'desc', // Order messages by timestamp in descending order (latest first)
                    },
                    take: 1, // Retrieve only the latest message per user
                },
            }
        });

        const followUpUsersWithMessage = clientLatestMessage.filter(user => { // filter the clients whose last message was more than a week ago
            const latestMessage = user.messages[0];
            return latestMessage && latestMessage.sentAt < oneWeekAgo;
        });

        const followUpUsers = followUpUsersWithMessage.map(({ messages, ...followUpUsers }) => followUpUsers); // return only the client information, without the las message

        return followUpUsers

    } catch (err) {
        console.log(err);
        throw err;
    }
};

function calculateDebtDayScore(days) { // Calculate Trustworth's Debt Score based on how old is his oldest debt
    if (days <= 365) {
        return 10;
    } else if (days <= 1825) {
        // Between 1 and 5 years (365 to 1825 days)
        return 10 - (days / 1825) * 10;
    } else {
        // More than 5 years (more than 1825 days)
        return 0;
    }
};

function calculateMessageDayScore(days) { // Calculate Interest's Most recent message Score based on how much time has passed since the last message the client sent
    if (days <= 1) {
        return 10;
    } else if (days <= 90) {
        // Between 1 and 90 days
        return 10 - (days / 90) * 10;
    } else {
        // More than 90 days
        return 0;
    }
};

function calculateMessageQScore(amount) { // Calculate Interest's Message Quantity Score based on the amount of messages the client has sent
    if (amount >= 8) {
        return 10;
    } else {
        // Less than 8 messages
        return (amount / 8) * 10;
    }
};

function calculateUpfrontScore(savings) { // Calculate Purchasing Power's Upfront Score, based on if the client has enough savings to pay the upfront
    if (savings >= 1.2 * upfront * ufvalue) {
        return 20;
    } else {
        // Less than 8 messages
        return (savings / (1.2 * upfront * ufvalue)) * 20;
    }
};

function calculateDebtScore(salary, debt) { // Calculate Trustworth's Debt Score, based on how big the debt is in comparison with the client's salary
    if (debt <= 2 * salary) {
        return 10;
    } else if (debt <= 12 * salary) {
        // Between 2 and 12 times salary
        return 10 - (debt / (12 * salary)) * 10;
    } else {
        // More than 12 times salary
        return 0;
    }
};

function calculateSalary120Score(salary, credit) { // Calculate Purchasing Power's Salary 120 Score, checking if 30% of the client's salary is enough to pay for mortgage fees if it was on 10 years, 120 fees. 
    if (120 * 0.3 * salary >= credit) {
        return 25;
    } else {
        // Less than 8 messages
        return (120 * 0.3 * salary / credit) * 25;
    }
};

function calculateSalary240Score(salary, credit) { // Calculate Purchasing Power's Salary 240 Score, checking if 30% of the client's salary is enough to pay for mortgage fees if it was on 20 years, 240 fees.
    if (240 * 0.3 * salary >= credit) {
        return 15;
    } else {
        // Less than 8 messages
        return (240 * 0.3 * salary / credit) * 15;
    }
};

const calculateScore = async (id) => { // Gets the client's info and uses the above functiones to calculate all scores and add them up
    try {
        const clientId = parseInt(id); // the id comes in string format in the header, it has to be converted to int
        const correctClient = await findUnique({ // we try to find the client that corresponds with the id
            where: {
                id: clientId,
            },
            include: {
                messages: {
                    where: {
                        role: "client", // More messages sent by client means more interest in buying
                    },
                    orderBy: {
                        sentAt: 'desc', // Most recent message first
                    }
                },
                debts: {
                    orderBy: {
                        dueDate: 'asc', // Order debts by dueDate in ascending order (oldest first)
                    },
                },
            }
        });

        const totalMessages = correctClient.messages.length;
        const totalDebt = correctClient.debts.reduce((acc, debt) => acc + debt.amount, 0); // Get total debt amount for user

        const today = new Date();
        const oldestDebtDate = correctClient.debts[0].dueDate;                          // Get oldest debt date
        const latestMessageDate = correctClient.messages[0].sentAt;                     // Get most recent message date

        const differenceInMsDebt = Math.abs(today - oldestDebtDate);                    // Calculate the difference in milliseconds between the two dates
        const daysOldestDebt = Math.floor(differenceInMsDebt / (1000 * 60 * 60 * 24));  // Convert milliseconds to days

        const differenceInMsMessage = Math.abs(today - latestMessageDate);                      // Calculate the difference in milliseconds between the two dates
        const daysLatestMessage = Math.floor(differenceInMsMessage / (1000 * 60 * 60 * 24));    // Convert milliseconds to days

        const salary = correctClient.salary
        const savings = correctClient.savings

        // Ready with all the client information, now for the score calculation

        const credit = (price - upfront) * (1 + interest) * ufvalue; // credit in CLP

        // Check the calculate functions for more information
        const debtDayScore = calculateDebtDayScore(daysOldestDebt);
        const messageDayScore = calculateMessageDayScore(daysLatestMessage);
        const messageQScore = calculateMessageQScore(totalMessages);
        const upfrontScore = calculateUpfrontScore(savings);
        const debtScore = calculateDebtScore(salary, totalDebt);
        const salary120Score = calculateSalary120Score(salary, credit);
        const salary240Score = calculateSalary240Score(salary, credit);

        const score = Math.round(debtDayScore + messageDayScore + messageQScore + upfrontScore + debtScore + salary120Score + salary240Score); // Add up all scores

        return score;
    } catch (err) {
        console.log(err);
        throw err;
    }
};

module.exports = {
    createClient,
    findClient,
    findAllClients,
    findFollowUp,
    calculateScore
};