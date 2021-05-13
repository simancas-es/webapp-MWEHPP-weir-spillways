var P;
var H0;

var MWL;
var nWL;

var innerfaceType;
var innerfaceAngler;

var approachType;
var B;
var b;
var approachAngler;

var designQ;
var RADIOSIF = document.getElementsByName('radioinnerface');
var RADIOSA = document.getElementsByName('approach');
var varFn;
var varFb;

window.onload = massListeners;
//import * as COORD from "coordinates.js";
var GRAVITY=9.81;
var TOLERANCE=0.05;

function massListeners(){
    for(item of document.getElementsByTagName("input")){
        item.addEventListener("change",function(e){updateVariables();});
    }
}
function updateVariables(){
    P=parseFloat(document.getElementById("varP").value)
    B=parseFloat(document.getElementById("varB").value);
    H0=parseFloat(document.getElementById("varH0").value);
    designQ=parseFloat(document.getElementById("varQ").value);
    MWL=parseFloat(document.getElementById("input_maximumwaterlvl").value);
    nWL=parseFloat(document.getElementById("input_normalwaterlvl").value);
    b=parseFloat(document.getElementById("input_approachb").value)
    innerfaceAngler=parseFloat(document.getElementById("input_innerfaceangler").value);
    approachAngler=parseFloat(document.getElementById("input_approachangler").value);

    //innerfacetype
    for (let r = 0; r < RADIOSIF.length; r++) {
        if (RADIOSIF[r].checked) {innerfaceType=RADIOSIF[r].value;break;}
    }
    //approachtype
    for (let r = 0; r < RADIOSA.length; r++) {
        if (RADIOSA[r].checked) {approachType=RADIOSA[r].value;break;}
    }
}

function calculate(){
    updateVariables();

    //check that we either have a b parameter or are going to calculate it for a specific Q
    if((!document.getElementById("unknownb").checked)&&(isNaN(b)||(b==""))){alert("SELECT b parameter before continuing");return false}

    //CALCULATING 
    let parammnmb;
    let nombreangleR;
    switch(innerfaceType){
        case "squared":
        parammnmb=90;
        nombreangleR="UPPER FACING ANGLE (degrees): ";
        innerfaceAngler=parammnmb;
        break;
        case "beveled":
        parammnmb=innerfaceAngler/H0;
        nombreangleR="UPPER FACING OFFSET (m): ";
        break;
        case "angled":
        parammnmb = innerfaceAngler;
        nombreangleR="UPPER FACING ANGLE (degrees): ";
        break;
        default:
        innerfaceType="squared";
        nombreangleR="UPPER FACING ANGLE (degrees): ";
        innerfaceAngler=parammnmb;
        parammnmb=90;
    }
    
    let finalm;
    let Qcalculated=0;  
    if(document.getElementById("unknownb").checked){
        finalm=estimate_m(P,H0, parammnmb);
        while (Math.abs((Qcalculated-designQ)/designQ)>TOLERANCE){
            b=designQ/(finalm*Math.sqrt(2*GRAVITY)*H0**(1.5));
            finalm=calculateM(parammnmb);
            Qcalculated= (finalm*Math.sqrt(2*GRAVITY)*H0**(1.5))*b;}
        }
        else{
            b=parseFloat(document.getElementById("input_approachb").value);
            finalm=calculateM(parammnmb);
            Qcalculated= (finalm*Math.sqrt(2*GRAVITY)*H0**(1.5))*b;
        }
  
        console.log("Q FINAL: Qcalculated:",Qcalculated,"b:",b,"H0:",H0,"m:",finalm,"angle_innerface:",innerfaceAngler);
        //alert(`FINAL RESULTS:\n Qcalculated: ${Qcalculated}\n b: ${b}\n H0: ${H0}\n m: ${finalm}`);
    
        addResultsAtEnd(`TYPE OF PROFILE:\t${innerfaceType}\n${nombreangleR+innerfaceAngler}\nP(m):\t${P}\nH0(m):\t${H0}\nB(m):\t${B}\nb(m):\t${b.toFixed(1)}\nQcalculated(m3/s):\t${Qcalculated.toFixed(0)}\nm:\t${finalm.toFixed(3)}\nFn:\t${varFn.toFixed(3)}\nFb:\t${varFb.toFixed(3)}`)
}
function addResultsAtEnd(){
    console.log("[...arguments].toString() ",[...arguments].toString());
    let ulresults=document.getElementById("listaresults");
    let liresult=document.createElement("li");
    let paragraph=document.createElement("p");
    //paragraph.innerText=[...arguments].toString();
    //liresult.appendChild(paragraph);
    liresult.innerText=[...arguments].toString()
    ulresults.appendChild(liresult);
}

function calculateM(parammnmb){
    //Assumes that we have all the necesary parameters

    let mn=choose_mn(innerfaceType,parammnmb);
    let mb=choose_mb(approachType,parammnmb);

    //CALCULATING M0
    let m0;
    let Fn=H0/(H0+2*P);
    let Fb=b/(3.5*B-2.5*b);
    if(mn>mb){
        m0=mn+(mb-mn)*Fn+(0.385-mn)*Fn*Fb;
    }else{
        m0=mb+(mn-mb)*Fb+(0.385-mn)*Fn*Fb;
    }
    //console.log(`Calculating m0... ${m0}`);
    varFn=Fn;
    varFb=Fb;
    return m0;
}
function estimate_m(varP,varH0,varParam){
    let matrixm;
    let coord = new COORD()
    switch(innerfaceType){
        case "squared":
            matrixm=[...coord.squarematrix];
        break;
        case "angled":
            matrixm=[...coord.squarematrix];
        break;
        case "beveled":
            matrixm=[...coord.beveledmatrix];
        break;
        default:
            matrixm=[...coord.squarematrix];
    }
    let coordinates_top=[];
    let coordinates_left=[];

    //REMOVE HEADERS = COORDINATES TOP
    coordinates_top=matrixm.shift();
    coordinates_top.shift();//we ignore the first column

    //SAVE DATA IN A VARIABLE
    matrixm.forEach(function(line,index){
        coordinates_left.push(line.shift());
    })


    let topx=varParam;
    let lefty=varP/varH0;

    let xi;
    for(xi=0;xi<coordinates_top.length;xi++){
        if (topx<=coordinates_top[xi] && topx>=coordinates_top[xi+1]){break;}
        if (topx>=coordinates_top[xi] && topx<=coordinates_top[xi+1]){break;}
    }
    let yi;
    for(yi=0;yi<coordinates_left.length;yi++){
        if (lefty<=coordinates_left[yi] && lefty>=coordinates_left[yi+1]){break;}
        if (lefty>=coordinates_left[yi] && lefty<=coordinates_left[yi+1]){break;}
    }

    valorm=interpolation_3d(topx,lefty,
                            coordinates_top[xi],coordinates_left[yi],
                            coordinates_top[xi+1],coordinates_left[yi+1],
                            matrixm[yi][xi],matrixm[yi+1][xi],matrixm[yi][xi+1],matrixm[yi+1][xi+1]
                                            )
    return valorm;
}
function choose_mn(tipo="squared",valor=0){
    let aMn;
    let aR;
    let aAngle;
switch(tipo){    
    case "squared":
    return 0.320;
    break;
    case "beveled":
    if (valor>=0.1){return 0.375;}
    aR=[0, 0.025,0.05,0.2,0.5,0.1];
    aMn=[0.320, 0.340,0.345,0.367,0.368,0.375];
    for(let i=0;i<aR.length;i++){
        if (valor > aR[i]){continue;}
        return interpolaton_2d(valor,aR[i-1],aR[i],aMn[i-1],aMn[i]);
    }
    break;

    case "angled":
    if(valor>63){return 0.340;}
    aAngle=[63,45,34,22];
    aMn=[0.34,0.35,0.36,0.375];
    for(let i=0;i<aAngle.length;i++){
        if (valor < aAngle[i]){continue;}
        return interpolaton_2d(valor,aAngle[i-1],aAngle[i],aMn[i-1],aMn[i]);
    }
    break;
    default:
        alert(`ERROR: please insert a correct innerface  parameter. Type: ${tipo}, value: ${valor}`);
            console.log("choose_ mb switch default")
    break;}


}
function choose_mb(tipo="squared",valor=0){
    let aMn;
    let aR;
    let aAngle;
    switch(tipo){
        case "squared":
        return 0.320;
        break;
        case "beveled":
        if (valor>=0.5){return 0.360;}
        if (valor<=0.05){return 0.345;}
        aR=[0,0.05,0.2,0.5];
        aMn=[0.32, 0.345,0.349,0.360];
        for(let i=0;i<aR.length;i++){
            if (valor > aR[i]){continue;}
            return interpolaton_2d(valor,aR[i-1],aR[i],aMn[i-1],aMn[i]);
        }
        break;
        
        case "angled":
        if(valor>63){return 0.343;}
        if(valor<=45){return 0.350;}
        aAngle=[63,45];
        aMn=[0.343,0.350];
        for(let i=0;i<aAngle.length;i++){
            if (valor < aAngle[i]){continue;}
            return interpolaton_2d(valor,aAngle[i-1],aAngle[i],aMn[i-1],aMn[i]);
        }
        break;
        default:
            alert(`ERROR: please insert a correct approach parameter. Type: ${tipo}, value: ${valor}`);
            console.log("choose_ mb switch default");
        break;}
    
    
    }

function interpolaton_2d(x,x1,x2,y1,y2){
    let result= x==x1 ? y1 : x==x2 ? y2 : y1+(x-x1)*(y2-y1)/(x2-x);
return result;
}
function interpolation_3d(x,y,x1,y1,x2,y2,z11,z12,z21,z22){
    for(item of arguments){
        item=parseFloat(item);
    }
    let diffx1=x-x1;
    let diffx2=x2-x;
    let diffy1=y-y1;
    let diffy2=y2-y;
    let area=[(diffx1*diffy1),(diffx1*diffy2),(diffx2*diffy1),(diffx2*diffy2)]
    let result=(area[0]*z22+area[1]*z12+area[2]*z21+area[3]*z11)/(area[0]+area[1]+area[2]+area[3])
    return result;
}
