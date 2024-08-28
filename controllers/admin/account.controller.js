const Account = require("../../models/account.model");
const Role = require("../../models/role.model");
const systemConfig = require("../../config/system");
const md5 = require("md5")


// [GET] /admin/accounts
module.exports.index = async (req, res) => {

    try {
        let find = {
            deleted: false
        }
    
        const accounts = await Account.find(find).select("-password -token");

        for (const account of accounts) {
            if(account.role_id){
                const role = await Role.findOne({
                    _id: account.role_id,
                    deleted: false
                });

                account.role = role;

            }else{
                account.role = { title: "Tài khoản chưa được phân quyền" };
            }
        };    
        res.render("admin/pages/accounts/index.pug",{
            pageTitle: "Danh sách tài khoản",
            accounts: accounts
        });
    } catch (error) {
        req.flash("error","Yêu cầu của bạn chưa thể thục hiện");
        res.redirect(`${systemConfig.prefixAdmin}/accounts`);
    }
};

//[GET] /admin/accounts/create
module.exports.create = async(req, res) => {

    const roles = await Role.find({
        deleted: false
    });

    res.render("admin/pages/accounts/create",{
        pageTitle: "Tạo tài khoản",
        roles: roles,
    }
    );
};

//[POST] /admin/accounts/create
module.exports.createPost = async(req, res) => {

    const emailExist = await Account.findOne({
        email: req.body.email,
        deleted: false
    });

    if(emailExist){
        req.flash("error",`Email ${req.body.email} đã tồn tại!`);
        res.redirect(`back`);
    }else{
        req.body.password = md5(req.body.password);

        const newAccount = new Account(req.body);
        await newAccount.save();
    
        req.flash("success","Thêm mới tài khoản thành công!");
        res.redirect(`${systemConfig.prefixAdmin}/accounts`);
    };
};

//[GET] /admin/accounts/edit/:id
module.exports.edit = async(req,res) => {
    try {
        const find = {
            _id: req.params.id,
            deleted: false
        };

        const account = await Account.findOne(find);
        
        const roles = await Role.find({
            deleted: false
        })


        res.render("admin/pages/accounts/edit",{
            pageTitle: "Cập nhật tài khoản",
            account: account,
            roles: roles
        }
        );
    } catch (error) {
        res.redirect(`${systemConfig.prefixAdmin}/accounts`);
    }
}

//[PATCH] /admin/accounts/edit/:id
module.exports.editPatch = async (req, res) => {

    const id = req.params.id;

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
    
        await Account.updateOne({_id: id},req.body);
        req.flash("success","Cập nhật tài khoản thành công!");
    }

    res.redirect(`back`);
    
}


//[GET] /admin/accounts/detail/:id
module.exports.detail = async(req,res) => {
    try {
        const find = {
            _id: req.params.id,
            deleted: false
        };

        const account = await Account.findOne(find);
        
        if(account.role_id){
            const role = await Role.findOne({
                _id: account.role_id,
                deleted: false
            });

            account.role = role;

        }else{
            account.role = { title: "Tài khoản chưa được phân quyền" };
        }


        res.render("admin/pages/accounts/detail",{
            pageTitle: "Chi tiết tài khoản",
            account: account,
        }
        );
    } catch (error) {
        req.flash("error","Không tìm thấy tài khoản!")
        res.redirect(`${systemConfig.prefixAdmin}/accounts`);
    }
}

//[DELETE] /admin/accounts/delete/:id
module.exports.deleteItem = async (req, res) => {
    const id = req.params.id;

    await Account.updateOne({ _id: id}, { 
        deleted: true,
        deletedAt: new Date()
    });
    req.flash('success', ` Xóa tài khoản thành công!`);
    res.redirect("back");
}