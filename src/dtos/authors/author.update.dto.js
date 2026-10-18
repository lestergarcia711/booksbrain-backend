export default class AuthorUpdateDto{
    #fullName;

    constructor({fullName}){
        this.#fullName = fullName;
    }

     get fullName(){ 
         return this.#fullName;
     }
}