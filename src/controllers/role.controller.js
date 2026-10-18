
 export default class RoleController{
    #roleService;

    constructor(roleService){
        this.#roleService = roleService;
    }

    getAll = async (req, res)=>{
        const data = await this.#roleService.getAll();
        res.status(200).json({ status: 'success', data});

    };

}