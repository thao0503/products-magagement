const express = require("express");
const router = express.Router();
const controller = require("../../controllers/client/user.controller");
const validate = require("../../validates/client/user.validate");
const multer  = require('multer')
const upload = multer()
const uploadCloud = require("../../middlewares/admin/uploadCloud.middleware")


router.get("/register",controller.register);

router.post("/register",validate.registerPost,controller.registerPost);

router.get("/login",controller.login);

router.post("/login",validate.loginPost,controller.loginPost);

router.get("/logout",controller.logout);

router.get("/password/forgot",controller.forgotPassword);

router.post("/password/forgot",validate.forgotPasswordPost,controller.forgotPasswordPost);

router.get("/password/otp",controller.otpPassword);

router.post("/password/otp",validate.otpPasswordPost,controller.otpPasswordPost);

router.get("/password/reset",controller.resetPassword);

router.post("/password/reset",validate.resetPasswordPost,controller.resetPasswordPost);

router.get("/profile",controller.profile);

router.patch("/profile",
    upload.single('avatar'),
    uploadCloud.uploadCloud,
    controller.profilePatch);

router.get("/orders", controller.orderManagement)

module.exports = router;