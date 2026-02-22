const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Loan = require('../models/Loan');
const Employee = require('../models/Employee');
const { protect, admin } = require('../middleware/authMiddleware');

router.use(protect);
router.use(admin);

// @desc    Get all loans
// @route   GET /api/admin/loans
const getLoans = async (req, res) => {
    try {
        const loans = await Loan.find()
            .populate('borrower', 'name email empId')
            .populate('sureties', 'name empId')
            .sort({ createdAt: -1 });
        res.json(loans);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new loan
// @route   POST /api/admin/loans
const createLoan = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { borrowerId, loanAmount, interestRate, emi, sureties, startDate } = req.body;

        const borrower = await Employee.findById(borrowerId).session(session);
        if (!borrower) throw new Error('Borrower not found');

        if (borrower.activeLoan) throw new Error('Employee already has an active loan');

        // Check sureties
        // sureties should be an array of Employee ObjectIds? Or names? Assuming IDs.
        // Actually, let's assume UI sends ObjectIds.

        const loan = new Loan({
            borrower: borrowerId,
            loanAmount,
            interestRate,
            emi,
            remainingBalance: loanAmount,
            sureties: sureties || [],
            startDate: startDate || Date.now()
        });

        await loan.save({ session });

        borrower.activeLoan = loan._id;
        borrower.loanStatus = 'Loan';
        await borrower.save({ session });

        // Update sureties too
        if (sureties && sureties.length > 0) {
            await Employee.updateMany(
                { _id: { $in: sureties } },
                { $push: { guaranteeingLoans: loan._id } }
            ).session(session);
        }

        await session.commitTransaction();
        session.endSession();

        res.status(201).json(loan);

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ message: error.message });
    }
};

// @desc Close Loan
// @route PUT /api/admin/loans/:id/close
const closeLoan = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const loan = await Loan.findById(req.params.id).session(session);
        if (!loan) throw new Error('Loan not found');

        loan.status = 'closed';
        loan.remainingBalance = 0;
        await loan.save({ session });

        // Clear from borrower and update loanStatus
        await Employee.findByIdAndUpdate(
            loan.borrower,
            { $unset: { activeLoan: 1 }, $set: { loanStatus: 'No Loan' } }
        ).session(session);

        // Remove loan from all sureties' guaranteeingLoans
        if (loan.sureties && loan.sureties.length > 0) {
            await Employee.updateMany(
                { _id: { $in: loan.sureties } },
                { $pull: { guaranteeingLoans: loan._id } }
            ).session(session);
        }

        await session.commitTransaction();
        session.endSession();
        res.json({ message: 'Loan closed successfully' });

    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ message: err.message });
    }
};

router.route('/')
    .get(getLoans)
    .post(createLoan);

router.put('/:id/close', closeLoan);

module.exports = router;
