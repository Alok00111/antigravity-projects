// File: src/models/transactionModel.js

const generateId = () => {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 10);
    return `${timestamp}-${randomPart}`;
};

const createTransaction = ({ type, amount, category, note = '', tags = [], receiptUri = null, date = null, accountId = 'cash', splits = null }) => ({
    id: generateId(),
    type,
    amount: parseFloat(amount),
    category,
    note,
    tags,
    receiptUri,
    accountId,
    splits, // [{ category, amount }] or null
    date: date || new Date().toISOString(),
    createdAt: new Date().toISOString(),
});

export default createTransaction;
