let myImage=document.querySelector('img');
myImage.addEventListener("click",function(){
  let mySrc=myImage.getAttribute("src");
  if(mySrc=="images/image1.png"){
    myImage.setAttribute('src','images/image2.jpg')

  }
  else
  {
    myImage.setAttribute('src','images/image1.png')
  }
});


let myButton=document.querySelector('button');
let myHeading=document.querySelector('h1');


function setUserName(){
  let myName=prompt("veuillez saisir votre nom .");
  localStorage.setItem("nom",myName);
  myHeading.textContent='Mozilla est cool '+ myName;
}
if (!localStorage.getItem("nom")) {
  setUserName();
} else {
  let storedName = localStorage.getItem("nom");
  myHeading.textContent = "Mozilla est cool, " + storedName;
}
myButton.addEventListener("click", function () {
  setUserName();
});
