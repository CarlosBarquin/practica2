import { getQuery } from "https://deno.land/x/oak@v11.1.0/helpers.ts";
import { Application, Router } from "https://deno.land/x/oak@v11.1.0/mod.ts";

import {
  ObjectId,
  MongoClient,
} from "https://deno.land/x/mongo@v0.31.1/mod.ts";

type Car = {
  id: string;
  matricula: string;
  numeroplaza: string;
  status : string;
};

console.log("hola");


type Carschema = Omit<Car, "id"> & { _id: ObjectId };

const client = new MongoClient();
await client.connect(
    "mongodb+srv://Carlos:holabuenas@cluster0.slujba9.mongodb.net/?authMechanism=SCRAM-SHA-1",
  );
const db = client.database("carstore");
console.log("hola");
const router = new Router();

router
   .get("/car/:id", async (context) => {
    if (context.params?.id) {
      const car: Carschema | undefined = await db
        .collection<Carschema>("cars")
        .findOne({
          _id: new ObjectId(context.params.id),
        });

      if (car) {
        context.response.body = car;
        return;
      }else{
        console.log("no hay coche");
        context.response.status = 404;
        return;
      }
    }
})
  .post("/addCars", async (context) => { 
    const result = context.request.body({ type: "json" });
    const value = await result.value;
    const Cars = await db
    .collection<Carschema>("cars")
    .find({})
    .toArray();
    if(Cars.find((car) => car.matricula === value.matricula)){
        context.response.status = 400;
        return;
    }
    const car: Partial<Car> = {
        matricula: value.matricula,
        numeroplaza: value.numeroplaza,
        status: value.status,
    };
    const id = await db
      .collection<Carschema>("cars")
      .insertOne(car as Carschema);
    car.id = id.toString();
    console.log(car);
    
    context.response.body = car;
     
  })
  .delete("/removeCar/:id", async (context) => {

    if (context.params?.id) {
        const count = await db.collection<Carschema>("cars").deleteOne({
          _id: new ObjectId(context.params.id),
        });
        if (count) {
            if(count.numeroplaza >0){
                context.response.status = 200;
            }else{
                context.response.status = 405;
            }
        } else {
          context.response.status = 404;
        }
      }
  
  })
  .get("/askCar", async (context) => {
    const Cars = await db
      .collection<Carschema>("cars")
        .find(car=> car.status === "libre")
        .toArray();
 
    if(Cars){
        Cars.at(0).status = "ocupado";
        context.response.body = Cars.at(0); 
    }else{
        context.response.status = 404;
        context.response
    }
    
  });
  .get("/askCar/:id", async (context) => {

  });

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 7777 });