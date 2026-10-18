export default class CategoryUpdateDto{
    #name;

    constructor({name}){
        this.#name = name;
    }

     get name(){ 
         return this.#name;
     }
}