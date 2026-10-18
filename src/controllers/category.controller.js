import { matchedData } from "express-validator";

 import CategoryCreateDto from '../dtos/categories/category.create.dto.js';
 import CategoryUpdateDto from '../dtos/categories/category.update.dto.js';

 export default class CategoryController{
    #categoryService;

    constructor(categoryService){
        this.#categoryService = categoryService;
    }

    getAll = async (req, res)=>{
        const data = await this.#categoryService.getAll();
        res.status(200).json({ status: 'success', data});

    };

     getById = async (req, res)=>{
        const {id } = matchedData(req, { locations: ['params']});
        const data = await this.#categoryService.getById(id);
        res.status(200).json({ status: 'success', data});

    };

    create = async (req, res) => {
        const dto = new CategoryCreateDto(matchedData(req, { locations: ['body']}));
        const data = await this.#categoryService.create(dto);
        res.status(201).json({ status: 'success', data});
    };
    
    update = async (req, res) => {
        const { id } = matchedData(req, {locations: ['params']});
        const dto = new CategoryUpdateDto(matchedData(req, { location: ['body']}));
        const data = await this.#categoryService.update(id, dto);
        res.status(200).json({ status: 'success', data});
    };
    
    delete = async (req, res) => {
        const { id } = matchedData(req, { locations: ['params']});
        await this.#categoryService.delete(id);
        res.status(204).send();

        };

    
 }