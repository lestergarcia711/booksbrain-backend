export default class UserCreateDto {
  #idCard;
  #fullName;
  #phone;
  #address;
  #email;
  #password;
  #roleId;

 constructor({idCard, fullName, phone, address, email, password,roleId}){
    this.#idCard= idCard;
    this.#fullName= fullName;
    this.#phone= phone ?? null;
    this.#address= address ?? null;
    this.#email= email ?? null;
    this.#password= password;
    this.#roleId= roleId;
 }

    get idCard(){return this.#idCard;}
    get fullName(){return this.#fullName;}
    get phone(){return this.#phone;}
   get address(){return this.#address;}
    get email(){return this.#email;}
    get password(){return this.#password;}
    get roleId(){return this.#roleId;}

}