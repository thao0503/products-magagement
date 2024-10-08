const Product = require("../../models/product.model");
const productCategory = require("../../models/product-category.model")
const Account = require("../../models/account.model")
const searchHelpers = require("../../helpers/search");
const filterStatusHelpers = require("../../helpers/filterStatus");
const paginationHelper = require("../../helpers/pagination");
const systemConfig = require("../../config/system")
const createTree = require("../../helpers/createTree")


//[GET] /admin/products
module.exports.index = async (req, res) => {
    //Kiểm tra quyền truy cập
    const permissions = res.locals.userRole.permissions;
    if (!permissions.includes("products_view")) {
        return res.status(403).render("admin/errors/403.pug", {
            message: "Bạn không có quyền truy cập vào trang này."
        });
    };

    try {
        // Bộ lọc 
        const filterStatus = filterStatusHelpers(req.query);
        // Kết thúc Bộ lọc 

        let find = {
            deleted: false
        };

        // Lọc sản phẩm theo trạng thái
        if(req.query.status){
        find.status = req.query.status;
        }
        //Kết thúc lọc sản phẩm theo trạng thái

        //Tìm kiếm 
        const objectSearch = searchHelpers(req.query);
        if(objectSearch.keywordRegex){
            find.title = objectSearch.keywordRegex; 
        }
        //Kết thúc tìm kiếm 

        // Phân trang
        const countProducts = await Product.countDocuments(find);
        let objectPagination = paginationHelper(
            {
                currentPage: 1,
                limitItems: 4
            },
            req.query,
            countProducts
        )
        // Kết thúc Phân trang

        // Sort
        let sort = {}
        if(req.query.sortKey && req.query.sortValue ){
            sort[req.query.sortKey] =  req.query.sortValue
        }else{
            sort.position = "desc"
        }
        //End Sort

        const products = await Product.find(find)
        .sort(sort)
        .limit(objectPagination.limitItems)
        .skip(objectPagination.skip);

        for (const product of products) {

            // Lấy thông tin người tạo
            const user = await Account.findOne({
                _id: product.createdBy.account_id
            });

            if(user){
                product.userFullname = user.fullName;
            };

            // Lấy thông tin người cập nhật gần nhất
            const updatedBy = product.updatedBy.slice(-1)[0];
            if(updatedBy){
                const userUpdate = await Account.findOne({
                    _id: updatedBy.account_id
                });

                updatedBy.userFullName = userUpdate.fullName;
            };

        };
        
        res.render("admin/pages/products/index.pug",{
            pageTitle: "Danh sách sản phẩm",
            products: products,
            filterStatus: filterStatus,
            keyword: objectSearch.keyword,
            pagination: objectPagination
        });
    } catch (error) {
        req.flash("error","Yêu cầu của bạn không hợp lệ!");
        res.redirect(`${systemConfig.prefixAdmin}/products`);
    }

}

//[PATCH] /admin/products/change-status/:status/:id
module.exports.changeStatus = async (req, res) => {

    const permissions = res.locals.userRole.permissions;
    if(permissions.includes("products_edit")){
        const status = req.params.status;
        const id = req.params.id;
        const updatedBy = {
            account_id: res.locals.user.id,
            updatedAt: new Date()
        }

        await Product.updateOne({ _id: id}, { 
            status: status,
            $push: {updatedBy: updatedBy}
        });
        
        req.flash('success', 'Cập nhật trạng thái thành công!');
        res.redirect("back");
    }else{
        return;
    }
}

//[PATCH] /admin/products/change-multi
module.exports.changeMulti = async (req, res) => {

    const permissions = res.locals.userRole.permissions;

    // Kiểm tra quyền trước khi thực hiện thao tác
    if (!permissions.includes("products_edit") && req.body.type !== "delete-all") {
        return;
    }
    
    if (!permissions.includes("products_delete") && req.body.type === "delete-all") {
        return;
    }

    const type = req.body.type;
    const ids = req.body.ids.split(", ");

    const updatedBy = {
        account_id: res.locals.user.id,
        updatedAt: new Date()
    }

    switch (type) {
        case "active":
            await Product.updateMany({_id: {$in: ids}}, {
                status: "active",
                $push: {updatedBy: updatedBy}
            });
            req.flash('success', `Đã cập nhật trạng thái thành công ${ids.length} sản phẩm!`);
            break;
        case "inactive":
            await Product.updateMany({_id: {$in: ids}}, {
                status: "inactive",
                $push: {updatedBy: updatedBy}   
            });
            req.flash('success', `Đã cập nhật trạng thái thành công ${ids.length} sản phẩm!`);
            break;
        case "delete-all":
            await Product.updateMany(
                {_id: {$in: ids}}, 
                {
                    deleted: true,
                    deletedBy: {
                        account_id: res.locals.user.id,
                        deletedAt: new Date()
                    }
                }
                );
            req.flash('success', `Đã xóa thành công ${ids.length} sản phẩm!`);
            break;
        case "change-position":
            for(const item of ids){
                let [id, position] = item.split("-");
                position = parseInt(position);
                
                await Product.updateOne({ _id: id},{
                    position: position,
                    $push: {updatedBy: updatedBy}
                });
            }
            break;
        default:
            break;
    }

    res.redirect("back");
};

//[DELETE] /admin/products/delete/:id
module.exports.deleteItem = async (req, res) => {

    const permissions = res.locals.userRole.permissions;
    if(permissions.includes("products_delete")){
        const id = req.params.id;

        await Product.updateOne({ _id: id}, { 
            deleted: true,
            deletedBy: {
            account_id: res.locals.user.id,
                deletedAt: new Date()
            }
        });
        req.flash('success', `Đã xóa sản phẩm thành công!`);
        res.redirect("back");
    }else{
        return;
    }
};

//[GET] /admin/products/create
module.exports.create = async(req, res) => {
    //Kiểm tra quyền truy cập
    const permissions = res.locals.userRole.permissions;
    if (!permissions.includes("products_create")) {
        return res.status(403).render("admin/errors/403.pug", {
            message: "Bạn không có quyền truy cập vào trang này."
        });
    };

    let find = {
        deleted: false
    }

    const category = await productCategory.find(find);

    const newCategory = createTree.tree(category)

    res.render("admin/pages/products/create",{
        pageTitle: "Thêm mới sản phẩm",
        category: newCategory
    }
    );
};

//[POST] /admin/products/create
module.exports.createPost = async(req, res) => {

    const permissions = res.locals.userRole.permissions;
    if(permissions.includes("products_create")){
        req.body.price = parseInt(req.body.price)
        req.body.discountPercentage = parseInt(req.body.discountPercentage)
        req.body.stock = parseInt(req.body.stock)
        if(req.body.position == ""){
            const countProducts = await Product.countDocuments();
            req.body.position = countProducts + 1;
        }else{
            req.body.position = parseInt(req.body.position);
        }

        req.body.createdBy = {
            account_id: res.locals.user.id
        }
        
        const product = new Product(req.body);
        await product.save();

        req.flash("success","Thêm mới sản phẩm thành công!")
        res.redirect(`${systemConfig.prefixAdmin}/products`);
    }else{
        return;
    }
};

//[GET] /admin/products/edit/:id
module.exports.edit = async(req, res) => {
    //Kiểm tra quyền truy cập
    const permissions = res.locals.userRole.permissions;
    if (!permissions.includes("products_edit")) {
        return res.status(403).render("admin/errors/403.pug", {
            message: "Bạn không có quyền truy cập vào trang này."
        });
    };

    try {
        const find = {
            deleted: false,
            _id: req.params.id
        }
    
        const product = await Product.findOne(find);

        // Lấy danh mục sản phẩm
        const category = await productCategory.find({
            deleted: false
        });
    
        const newCategory = createTree.tree(category)
        // Kết thúc lấy danh mục sản phẩm
    
    
        res.render("admin/pages/products/edit",{
            pageTitle: "Chỉnh sửa sản phẩm",
            product: product,
            category: newCategory
        }  
        );
    } catch (error) {
        req.flash("error","Không tìm thấy sản phẩm")
        res.redirect(`${systemConfig.prefixAdmin}/products`);
    };
};

//[PATCH] /admin/products/edit/:id
module.exports.editPatch = async(req, res) => {

    const permissions = res.locals.userRole.permissions;
    if(permissions.includes("products_edit")){
        const id = req.params.id
        req.body.price = parseInt(req.body.price)
        req.body.discountPercentage = parseInt(req.body.discountPercentage)
        req.body.stock = parseInt(req.body.stock)
        req.body.position = parseInt(req.body.position);
        

        const updatedBy = {
            account_id: res.locals.user.id,
            updatedAt: new Date()
        }

        await Product.updateOne({ _id: id},{
            ...req.body,
            $push: { updatedBy: updatedBy}
        })
        
        req.flash("success","Cập nhật thành công")
        res.redirect(`back`);
    }else{
        return;
    }
};

//[GET] /admin/products/detail/:id
module.exports.detail = async(req, res) => {
    //Kiểm tra quyền truy cập
    const permissions = res.locals.userRole.permissions;
    if (!permissions.includes("products_view")) {
        return res.status(403).render("admin/errors/403.pug", {
            message: "Bạn không có quyền truy cập vào trang này."
        });
    };

    try {
        const find = {
            deleted: false,
            _id: req.params.id
        }
    
        const product = await Product.findOne(find);

        //Lấy thông tin người tạo
        const user =  await Account.findOne({
            _id: product.createdBy.account_id
        });

        if(user){
            product.createdBy.userFullName = user.fullName;
        };

        // Lấy thông tin những người cập nhật
        const updatedBy = product.updatedBy;
        if(updatedBy){
            for (const data of updatedBy) {
                const userUpdate = await Account.findOne({
                    _id: data.account_id
                });
    
                data.userFullName = userUpdate.fullName;
            };
        };
        
        res.render("admin/pages/products/detail",{
            pageTitle: product.title,
            product: product
        }   
        )
    } catch (error) {

        req.flash("error","Không tìm thấy sản phẩm")
        res.redirect(`${systemConfig.prefixAdmin}/products`);
    }
};
