import express from 'express';

 const app = express();

 app.use(express.json({limit: '10kb'}));

 app.get('/api/v1/health',(req, res)=>{
    res.json({ status:'success', message:'API funcionando'});

 });

 export default app;
 
