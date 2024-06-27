const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const { Schema } = mongoose;

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-Umer:umer123@cluster0.nm5etsg.mongodb.net/todolistDB");

const itemsSchema = new Schema({
  name: String
});

const listSchema = new Schema({
  name: String,
  items: [itemsSchema]
});

const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("List", listSchema);

const item1 = new Item({
  name: "Welcome to your to-do list"
});
const item2 = new Item({
  name: "Hit the + sign to add an Item"
});
const item3 = new Item({
  name: "<-- Hit this sign to delete an Item"
});
const DefaultItems = [item1, item2, item3];

app.get("/", async function (req, res) {
  const defItems = await Item.find({});
  if (defItems.length === 0) {
    try {
      await Item.insertMany(DefaultItems);
      console.log("Items are successfully entered");
    } catch (error) {
      console.log(error);
    }
    res.redirect("/");
  } else {
    res.render("list", { listTitle: "Today", newListItems: defItems });
  }
});

app.get("/:customListName", async function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  try {
    const userChosenDocument = await List.findOne({ name: customListName });

    if (!userChosenDocument) {
      const list = new List({
        name: customListName,
        items: DefaultItems
      });

      await list.save();
      res.redirect("/" + customListName);
    } else {
      res.render("list", { listTitle: userChosenDocument.name, newListItems: userChosenDocument.items });
    }
  } catch (error) {
    console.error("Error finding document:", error);
  }
});

app.post("/", async function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName
  });

  if (listName === "Today") {
    await newItem.save();
    res.redirect("/");
  } else {
    try {
      const foundList = await List.findOne({ name: listName });

      if (foundList) {
        foundList.items.push(newItem);
        await foundList.save();
        res.redirect("/" + listName);
      } else {
        console.error("List not found: " + listName);
        res.status(404).send("List not found.");
      }
    } catch (error) {
      console.error("Error finding or saving the list:", error);
      res.status(500).send("An error occurred while processing your request.");
    }
  }
});

app.post("/delete", async function (req, res) {
  const checkedItem = req.body.checkbox;
  const listName = req.body.listName;

  try {
    if (listName === "Today") {
      await Item.findByIdAndDelete(checkedItem);
      res.redirect("/");
    } else {
      await List.findOneAndUpdate(
        { name: listName },
        { $pull: { items: { _id: checkedItem } } }
      );
      res.redirect("/" + listName);
    }
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
