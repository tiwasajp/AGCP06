const admin = require('firebase-admin');
admin.initializeApp();
let db = admin.firestore();

db.collection("users").where("price", "==", 2001)
.onSnapshot((querySnapshot) => {
	if (querySnapshot.empty) {
      console.log('No matching documents.');
	  return;
	} 
	console.log(`Received query snapshot of size ${querySnapshot.size}`);
    var dataset = [];
    querySnapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {	
          console.log(change.doc.id, "=>", change.doc.data());
    	  dataset.push(change.doc.data().price);
        }
    });
    console.log(dataset.join(", "));
});

(async () => {
//await db.collection('users').doc('10107').delete().then(() => {console.log("deleted");});

setTimeout(() => {
	db.collection('users').doc('10107').update({
	  price: 2001, 
	  quantity:201,
	  data:[{a:"abc",b:"aaa"},{a:"a12",b:"a2a"}]
	})
	.catch((err) => {
	  console.log("Error adding documents " + err);
    });
	
	(async () => {
	  const resp = await db.collection("users").where("price", "==", 2001).get();
	  resp.forEach(doc => {
		  console.log(doc.id, '=>', doc.data());
		});
	})();
	
}, 3000);
})();

/*
db.collection('users').doc('1234567890').set({
  product: 'Avaya',
  data: {price: 2000, quantity:200}
})
.catch((err) => {
  console.log("Error adding documents " + err);
});
*/


/*
db.collection('users').get()
.then((snapshot) => {
  snapshot.forEach((doc) => {
    if (doc.id === "1234567890") {
      console.log(doc.id + "=>" + JSON.stringify(doc.data()));
    }
    else {
      ;
    }
  });
})
.catch((err) => {
  console.log("Error getting documents " + err);
});
*/


/*
db.collection('users').doc('1234567890').delete();
*/



/*
let FieldValue = require('firebase-admin').firestore.FieldValue;
db.collection('users').doc('1234567890').update({
	  product: "cm",
	  data: FieldValue.delete()
	})
	.catch((err) => {
	  console.log("Error adding documents " + err);
	});
*/


