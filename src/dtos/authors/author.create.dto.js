export default class AuthorCreateDto{
    #fullName;

    constructor({fullName}){
        this.#fullName = fullName;
    }

     get fullName(){ 
         return this.#fullName;
     }
}