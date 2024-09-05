const Account = require("../../models/account.model");
const md5 = require("md5")

// [GET] /admin/my-account
module.exports.index = (req, res) => {
    res.render("admin/pages/my-account/index.pug",{
        pageTitle: "Thông tin cá nhân"
    });
}

//[GET] /admin/my-account/edit
module.exports.edit = async(req,res) => {
        res.render("admin/pages/my-account/edit",{
            pageTitle: "Cập nhật thông tin cá nhân",
        }
        );
}

//[PATCH] /admin/my-account/edit
module.exports.editPatch = async (req, res) => {

    const id = res.locals.user.id;

    const emailExist = await Account.findOne({
        _id: { $ne: id},
        email: req.body.email,
        deleted: false
    });

    if(emailExist){
        req.flash("error",`Email ${req.body.email} đã tồn tại!`);
    }else{
        if(req.body.password){
            req.body.password = md5(req.body.password);
        }else{
            delete req.body.password;
        }
        
        const updatedBy = {
            account_id: id,
            updatedAt: new Date()
        };

        await Account.updateOne({_id: id},{
            ...req.body,
            $push: {updatedBy: updatedBy}
        });
        req.flash("success","Cập nhật tài khoản thành công!");
    }

    res.redirect(`back`);
}