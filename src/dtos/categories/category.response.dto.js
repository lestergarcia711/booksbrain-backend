export default class CategoryResponseDto{
    #id;
    #name;

     constructor({ category_id, category_name}){
        this.#id = category_id;
        this.#name = category_name;

     }

   toJSON(){
        return{ id: this.#id, name: this.#name};
     }
}