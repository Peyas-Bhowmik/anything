const { body, validationResult } = require('express-validator')
const User = require('../models/user')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
require('dotenv').config()

module.exports.updateName = async (req, res) => {
    const { name, id } = req.body
    if (name === '') {
        return res.status(400).json({ errors: [{ msg: 'Name is required' }] })
    } else {
        try {
            const user = await User.findOneAndUpdate({ _id: id }, { name: name }, { new: true })
            const token = jwt.sign({ user }, process.env.SECRET, { expiresIn: '7d' })

            return res.status(200).json({ token, msg: 'Your name has been updated successfully' })
        } catch (error) {
            return res.status(400).json({ errors })
        }
    }
}

module.exports.updatePasswordValidation = [
    body("current").not().isEmpty().trim().withMessage('current password is required'),
    body("newPassword").isLength({ min: 6 }).withMessage('new password must be 6 characters long'),
]

module.exports.updatePassword = async (req, res) => {
    const { current, newPassword, userId } = req.body
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    } else {
        const user = await User.findOne({ _id: userId })
        if (user) {
            const matched = await bcrypt.compare(current, user.password)
            if (!matched) {
                return res.status(400).json({ errors: [{ msg: 'Current password is wrong' }] })
            } else {
                try {
                    const salt = await bcrypt.genSalt(10)
                    const hash = await bcrypt.hash(newPassword, salt)
                    const newUser = await User.findOneAndUpdate({ _id: userId }, { password: hash }, { new: true })
                    return res.status(200).json({msg: 'Your password has been updated successfully'})
                } catch (error) {
                    return res.status(400).json({ errors })
                }
            }
        }
    }

}