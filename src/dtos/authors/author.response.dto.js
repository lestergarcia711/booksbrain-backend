export default class AuthorResponseDto{
    #id;
    #fullName;

     constructor({ author_id, full_name}){
        this.#id = author_id;
        this.#fullName = full_name;

     }

   toJSON(){
        return{ id: this.#id, fullName: this.#fullName};
     }
}