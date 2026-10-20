export default class UserReponseDto{
    #id;
    #idCard;
    #fullName;
    #phone;
    #address;
    #email;
    #roleId;
    #roleName;


    constructor(row){
        this.#id = row.user_id;
        this.#idCard = row.id_card;
        this.#fullName = row.full_name;
        this.#phone = row.phone;
        this.#address = row.address;
        this.#email = row.email;
        this.#roleId = row.role_id;
        this.#roleName = row.role_name;

    }

    toJSON(){
        return{
            id: this.#id,
            idCard: this.#idCard,
            fullName: this.#fullName,
            phone: this.#phone,
            address: this.#address,
            email: this.#email,
            role: { id: this.#roleId, name: this.#roleName },
        };
    }

}