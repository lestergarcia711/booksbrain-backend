export default class BookCreateDto{
    #title;
    #isbn;
    #salePrice;
    #categoryId;
    #authorIds;

    constructor ({ title, isbn, salePrice, categoryId, authorIds}){
        this.#title = title;
        this.#isbn = isbn;
        this.#salePrice =  salePrice;
        this.#categoryId = categoryId;
        this.#authorIds = [...new Set(authorIds.map(Number))];
    }

    get title     (){ return this.#title; }
    get isbn(){ return this.#isbn; }
    get salePrice(){ return this.#salePrice; }
    get categoryId(){ return this.#categoryId; }
    get authorIds(){ return this.#authorIds; }
}
