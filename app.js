//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose")
const _ = require("lodash")

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-julian:verysecurepassword@cluster0.q9zsfks.mongodb.net/todolistDB")

const itemsSchema = new mongoose.Schema ({
  name: String
})

const Item = mongoose.model("Item", itemsSchema)

const listSchema = new mongoose.Schema ({
  name: String, 
  items: [itemsSchema]
})

const List = mongoose.model("List", listSchema)

const task1 = new Item ({name: "Buy Food"})
const task2 = new Item ({name: "Cook Food"})
const task3 = new Item ({name: "Eat Cook"})

const defaultItems = [task1, task2, task3]


app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {
    if (err) {
      console.log(err)
    } else {

      if (foundItems.length === 0) {
        

        Item.insertMany(defaultItems, function(err) {
          if (err) {
            console.log(err)
          } else {
            console.log("success")
          }
        }) 
      } else {
        res.render("list", {listTitle: "Today", newListItems: foundItems});
      }
      
    }
  })
});


app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName)

  List.findOne({name: customListName}, function(err, foundList){
    if (!err) {
      if(!foundList){
        const list = new List ({
          name: customListName,
          items: defaultItems
        })

        list.save()
        res.redirect("/" + customListName)
      } else {
       res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
      }
    }
})
})

app.post("/", function(req, res){

  const item = req.body.newItem;
  const listName = req.body.list
  const newItem = new Item({name: item})

  if (listName === "Today"){
    newItem.save()
    res.redirect("/")
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(newItem)
      foundList.save();
      res.redirect("/" + listName)
    })
  }

  

});

app.post("/delete", function (req, res) {
  const checkedItemId = mongoose.Types.ObjectId(req.body.checkbox)

  const listName = req.body.listName

  console.log(listName)

  if (listName === "Today") {
    Item.deleteOne({_id : checkedItemId}, function (err) {
      if (!err) {
        console.log("Success");
        res.redirect("/");
      }
    })
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if(!err){
        res.redirect("/"+listName)
      }
    })
  }
 
  
});


app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started successfully");
});
