export default class UserUpdateDto{
    #id;
    #fullName;
    #phone;
    #address;
    #email;


    constructor ({ fullName, phone, address, email }){
        this.#fullName = fullName;
        this.#phone = phone;
        this.#address = address;
        this.#email = email;

    }
    
    get fullName (){return this.#fullName;}
    get phone(){return this.#phone;}
    get address(){return this.#address;}
    get email(){return this.#email;}

    toObject(){
        const fields = {
            fullName: this.#fullName,
            phone: this.#phone,
            address: this.#address,
            email: this.#email,
        };
        return Object.fromEntries(
            Object.entries(fields).filter(([, value])=>value !== undefined)

        );
    }

}