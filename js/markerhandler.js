var tableNumber = null;

AFRAME.registerComponent("markerhandler", {
  init: async function() {
    if (tableNumber === null) {
      this.askTableNumber();
    }
    var toys = await this.getToys();

    console.log(toys)

    this.el.addEventListener("markerFound", () => {
      var markerId = this.el.id;
      this.handleMarkerFound(toys, markerId);
    });

    this.el.addEventListener("markerLost", () => {
      this.handleMarkerLost();
    });
  },
  handleMarkerFound: function(toys, markerId) {
    // Changing button div visibility
    console.log('he')
    var buttonDiv = document.getElementById("button-div");
    buttonDiv.style.display = "flex";

    var orderButtton = document.getElementById("order-button");
    var orderSummaryButtton = document.getElementById("order-summary-button");
    var payNow = document.getElementById("pay-button");

    // Handling Click Events
    orderButtton.addEventListener("click", () => {
      var uid;
      tableNumber <= 9 ? (uid = `T0${tableNumber}`) : `T${tableNumber}`;
      this.handleOrder(uid, toy);
      swal({
        icon: "https://i.imgur.com/4NZ6uLY.jpg",
        title: "Thanks For Order !",
        text: "  ",
        timer: 2000,
        buttons: false
      });
    });

    orderSummaryButtton.addEventListener("click", () => {
      this.handleOrderSummary()
    });
    payNow.addEventListener("click", () => {
      this.handlePayment()
    });
    // Changing Model scale to initial scale
    var toy = toys.filter(toy => toy.id === markerId)[0];

    var model = document.querySelector(`#model-${toy.id}`);
    model.setAttribute("position", toy.model_geometry.position);
    model.setAttribute("rotation", toy.model_geometry.rotation);
    model.setAttribute("scale", toy.model_geometry.scale);
  },
  handleOrder: function (tNumber, toy) {
    //Reading current table order details
    firebase
      .firestore()
      .collection("tables")
      .doc(tNumber)
      .get()
      .then(doc => {
        var details = doc.data();

        if (details["current_orders"][toy.id]) {
          //Increasing Current Quantity
          details["current_orders"][toy.id]["quantity"] += 1;

          //Calculating Subtotal of item
          var currentQuantity = details["current_orders"][toy.id]["quantity"];

          details["current_orders"][toy.id]["subtotal"] =
            currentQuantity * toy.price;
        } else {
          details["current_orders"][toy.id] = {
            item: toy.toy_name,
            price: toy.price,
            quantity: 1,
            subtotal: toy.price * 1
          };
        }

        details.total_bill += toy.price;

        // Updating db
        firebase
          .firestore()
          .collection("tables")
          .doc(doc.id)
          .update(details);
      });
  },
  askTableNumber: function () {
    var iconUrl = "https://raw.githubusercontent.com/whitehatjr/menu-card-app/main/hunger.png";
    swal({
      title: "Welcome to Toy Factory",
      icon: iconUrl,
      content: {
        element: "input",
        attributes: {
          placeholder: "Type your uid",
          type: "number",
          min: 1
        }
      },
      closeOnClickOutside: false,
    }).then(inputValue => {
      tableNumber = inputValue;
    });
  },
  getToys: async function() {
    console.log('e')
    return await firebase
      .firestore()
      .collection("toys")
      .get()
      .then(snap => {
        return snap.docs.map(doc => doc.data());
      });
  },
  handleMarkerLost: function() {
    // Changing button div visibility
    var buttonDiv = document.getElementById("button-div");
    buttonDiv.style.display = "none";
  },
  getOrderSummary: async function(uid){
    return await firebase
        .firestore()
        .collection("users")
        .doc(uid)
        .get()
        .then(doc => {
            var data = doc.data();
            console.log("Data from Firestore:", data);
            return data;
        })
        .catch(error => {
            console.error("Error getting order summary:", error);
        });
},

  handleOrderSummary: async function () {

    //Getting Table Number
    var uid;
    tableNumber <= 9 ? (uid = `T0${tableNumber}`) : `T${tableNumber}`;

    //Getting Order Summary from database
    var orderSummary = await this.getOrderSummary(uid);

    //Changing modal div visibility
    var modalDiv = document.getElementById("modal-div");
    modalDiv.style.display = "flex";

    //Get the table element
    var tableBodyTag = document.getElementById("bill-table-body");

    //Removing old tr(table row) data
    tableBodyTag.innerHTML = "";

    //Get the cuurent_orders key
    console.log(orderSummary)
    console.log(orderSummary.current_orders)
    var currentOrders = Object.keys(orderSummary.current_orders);

    currentOrders.map(i => {

      //Create table row
      var tr = document.createElement("tr");

      //Create table cells/columns for ITEM NAME, PRICE, QUANTITY & TOTAL PRICE
      var item = document.createElement("td");
      var price = document.createElement("td");
      var quantity = document.createElement("td");
      var subtotal = document.createElement("td");

      //Add HTML content 
      item.innerHTML = orderSummary.current_orders[i].item;

      price.innerHTML = "$" + orderSummary.current_orders[i].price;
      price.setAttribute("class", "text-center");

      quantity.innerHTML = orderSummary.current_orders[i].quantity;
      quantity.setAttribute("class", "text-center");

      subtotal.innerHTML = "$" + orderSummary.current_orders[i].subtotal;
      subtotal.setAttribute("class", "text-center");

      //Append cells to the row
      tr.appendChild(item);
      tr.appendChild(price);
      tr.appendChild(quantity);
      tr.appendChild(subtotal);

      //Append row to the table
      tableBodyTag.appendChild(tr);
    });

    //Create a table row to Total bill
    var totalTr = document.createElement("tr");

    //Create a empty cell (for not data)
    var td1 = document.createElement("td");
    td1.setAttribute("class", "no-line");

    //Create a empty cell (for not data)
    var td2 = document.createElement("td");
    td1.setAttribute("class", "no-line");

    //Create a cell for TOTAL
    var td3 = document.createElement("td");
    td1.setAttribute("class", "no-line text-center");

    //Create <strong> element to emphasize the text
    var strongTag = document.createElement("strong");
    strongTag.innerHTML = "Total";

    td3.appendChild(strongTag);

    //Create cell to show total bill amount
    var td4 = document.createElement("td");
    td1.setAttribute("class", "no-line text-right");
    td4.innerHTML = "$" + orderSummary.total_bill;

    //Append cells to the row
    totalTr.appendChild(td1);
    totalTr.appendChild(td2);
    totalTr.appendChild(td3);
    totalTr.appendChild(td4);

    //Append the row to the table
    tableBodyTag.appendChild(totalTr);
  },
  handlePayment: function () {
    // Close Modal
    document.getElementById("modal-div").style.display = "none";

    // Getting Table Number
    var uid;
    tableNumber <= 9 ? (uid = `T0${tableNumber}`) : `T${tableNumber}`;

    //Reseting current orders and total bill
    firebase
      .firestore()
      .collection("tables")
      .doc(uid)
      .update({
        current_orders: {},
        total_bill: 0
      })
      .then(() => {
        swal({
          icon: "success",
          title: "Thanks For Paying !",
          text: "We Hope You Enjoyed Your Food !!",
          timer: 2500,
          buttons: false
        });
      });
  },
});
