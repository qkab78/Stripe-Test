require("dotenv").config();
const express = require("express");
const cors = require("cors");
const uuid = require("uuid4");
const stripe = require("stripe")(process.env.STRIPE_API_KEY);

const app = express();

app.use(express.json());
app.use(cors());

app.post("/checkout", async (req, res) => {
    console.log("Request:", req.body);
    let error;
    let status;

    try {
        const { product, token } = req.body;
        const customer = await stripe.customers.create({
            name: token.card.name,
            email: token.email,
            source: token.id
        });
        const idempotency_key = uuid();
        const charge = await stripe.charges.create(
            {
                amount: product.price * 100,
                currency: process.env.CURRENCY,
                customer: customer.id,
                receipt_email: token.email,
                description: `Achat du produit : ${product.name}`,
                shipping: {
                    name: token.card.name,
                    address: {
                        line1: token.card.address_line1,
                        line2: token.card.address_line2,
                        city: token.card.address_city,
                        country: token.card.address_country,
                        postal_code: token.card.address_zip
                    }
                }
            },
            { idempotency_key }
        );
        console.log("Charge: ", { charge });
        status = "success";
    } catch (error) {
        console.error("Error: ", { error });
        status = "error";
    }
    res.json({ error, status });
});

app.listen(8080, () => `Server runnning on port 8080`);
