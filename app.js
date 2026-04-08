let provider, signer, user, contract, chart;

const contractAddress = "0x7221bcFC39b47B330f4DE8508A74802eBa52a912";

const abi = [
    "function owner() view returns(address)",
    "function withdrawAllLiquidity()",
    "function withdrawLiquidity(uint256)",
    "function withdrawSellTax()",
    "function withdrawUnsoldTRC(uint256)",
    "function getContractPOLBalance() view returns(uint256)",
    "function getAvailableLiquidity() view returns(uint256)"
];

// ================= CONNECT =================
document.getElementById("connectBtn").onclick = async () => {

    if(!window.ethereum){
        alert("Install MetaMask");
        return;
    }

    await ethereum.request({method:'eth_requestAccounts'});

    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    user = await signer.getAddress();

    document.getElementById("wallet").innerText =
        user.slice(0,6) + "..." + user.slice(-4);

    contract = new ethers.Contract(contractAddress, abi, signer);

    const owner = await contract.owner();

    if(user.toLowerCase() === owner.toLowerCase()){
        updateStatus("✅ Owner Connected");
    }else{
        updateStatus("⚠️ Not Owner");
    }

    loadData();
    setInterval(loadData, 10000);

    initChart();
};

// ================= LOAD DATA =================
async function loadData(){

    const total = await contract.getContractPOLBalance();
    const available = await contract.getAvailableLiquidity();

    const totalF = ethers.utils.formatEther(total);
    const availF = ethers.utils.formatEther(available);

    document.getElementById("contractBalance").innerText = totalF;
    document.getElementById("availableLiquidity").innerText = availF;

    updateChart(totalF);
}

// ================= TRANSACTION =================
async function handleTx(tx){

    try{
        updateStatus("⏳ Waiting...");

        const sent = await tx;

        updateStatus(`Pending... 
        <a href="https://polygonscan.com/tx/${sent.hash}" target="_blank">View</a>`);

        await sent.wait();

        updateStatus("✅ Confirmed");

        loadData();

    }catch(e){
        updateStatus("❌ Failed");
    }
}

function updateStatus(msg){
    document.getElementById("status").innerHTML = msg;
}

// ================= BUTTONS =================

document.getElementById("withdrawAllBtn").onclick = () => {
    handleTx(contract.withdrawAllLiquidity());
};

document.getElementById("withdrawAmountBtn").onclick = () => {
    const amt = document.getElementById("withdrawAmount").value;
    handleTx(contract.withdrawLiquidity(ethers.utils.parseEther(amt)));
};

document.getElementById("withdrawTaxBtn").onclick = () => {
    handleTx(contract.withdrawSellTax());
};

document.getElementById("withdrawTRCBtn").onclick = () => {
    const amt = document.getElementById("withdrawTRC").value;
    handleTx(contract.withdrawUnsoldTRC(ethers.utils.parseUnits(amt,18)));
};

// ================= CHART =================
function initChart(){

    const ctx = document.getElementById("chart").getContext("2d");

    chart = new Chart(ctx,{
        type:"line",
        data:{
            labels:[],
            datasets:[{
                label:"POL Liquidity",
                data:[],
                borderColor:"cyan",
                backgroundColor:"rgba(0,255,255,0.1)"
            }]
        },
        options:{ responsive:true }
    });
}

function updateChart(val){

    if(!chart) return;

    chart.data.labels.push(new Date().toLocaleTimeString());
    chart.data.datasets[0].data.push(val);

    if(chart.data.labels.length > 20){
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
    }

    chart.update();
}
