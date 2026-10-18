import { matchedData } from "express-validator";

 import AuthorCreateDto from '../dtos/authors/author.create.dto.js';
 import AuthorUpdateDto from '../dtos/authors/author.update.dto.js';

 export default class AuthorController{
    #authorService;

    constructor(authorService){
        this.#authorService = authorService;
    }

    getAll = async (req, res)=>{
        const data = await this.#authorService.getAll();
        res.status(200).json({ status: 'success', data});

    };

     getById = async (req, res)=>{
        const {id } = matchedData(req, { locations: ['params']});
        const data = await this.#authorService.getById(id);
        res.status(200).json({ status: 'success', data});

    };

    create = async (req, res) => {
        const dto = new AuthorCreateDto(matchedData(req, { locations: ['body']}));
        const data = await this.#authorService.create(dto);
        res.status(201).json({ status: 'success', data});
    };
    
    update = async (req, res) => {
        const { id } = matchedData(req, {locations: ['params']});
        const dto = new AuthorUpdateDto(matchedData(req, { locations: ['body']}));
        const data = await this.#authorService.update(id, dto);
        res.status(200).json({ status: 'success', data});
    };
    
    delete = async (req, res) => {
        const { id } = matchedData(req, { locations: ['params']});
        await this.#authorService.delete(id);
        res.status(204).send();

        };

    
 }