import { Button, Card, Form, Image, Input, Typography, Avatar, Spin, message } from 'antd'
import React, { useState } from 'react'
import axios from 'axios'
import {Buffer} from 'buffer'
import { NFTStorage, File } from 'nft.storage'
import { ethers } from "ethers";
import config from './config.json';
import NFT from './abiNFT.json';
import './App.css';
import logo from "./nft-logo.png"
import bnb from "./bnb.png"
import walletLogo from "./wallet.png"

function App() {

  const [provider, setProvider] = useState(null);
  const [wallet, setWallet] = useState(null);

  //handle button conect wallet
  const handleConnectWallet = async () => {
      //init provider
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      //get address and balance
      const address = await signer.getAddress();
      const bigBalance = await signer.getBalance();
      const balance = Number.parseFloat(ethers.utils.formatEther(bigBalance))
      setWallet({address, balance}); //set address and balance to state wallet
      setProvider(provider);
  }

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMinted, setIsMinted] = useState(false);

  //url generate image
  const URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2";
  
  //handle generate image => upload image to ipfs => get ipfs url metadata to mint NFT and deploy bsc testnet, opensea
  const handleNFT = async (e) => {
    e.preventDefault();
 
    if(provider == null) {
      message.warning("Please connect your wallet !", 1)
    }
    else {
      //check name, description
      if(!name || !description || (!name && !description)) {
        message.warning("Please input image information !", 1)
      }
      else {
        console.log(name, description);
        setIsLoading(true);

        //get image with name and description from huggingface
        const res = await axios({
          url: URL,
          method: 'POST',
          data: JSON.stringify({
            inputs: description,  options: { wait_for_model: true },
          }),
          responseType: 'arraybuffer',
        })

        console.log(res.data) 
        const dataImg = res.data;
        const base64data = Buffer.from(dataImg).toString('base64')
        const img = `data:image/png;base64,` + base64data 
        setImage(img)//set img = res
        setIsLoading(false);
  
        message.info("Please wait for create metadata URL...", 2)
 
  
        //init nftstorage through storage key
        const nftstorage = new NFTStorage({token: process.env.REACT_APP_NFT_STORAGE_KEY})
        console.log(nftstorage)

        console.log(` ${name} `)
        //upload image to nftstorage
        const { ipnft } = await nftstorage.store({
          name,
          description,
          image: new File([dataImg], "image", {type: "image/png"}),
        })

        //url metadata to mint nft
        const ipfsURL = `https://ipfs.io/ipfs/${ipnft}/metadata.json` ;
        console.log(ipfsURL)

        //get chainid
        const { chainId } = await provider.getNetwork()

        //init nft through address and abis
        const nft = new ethers.Contract(config[chainId].nft.address, NFT, provider)


        const signer = await provider.getSigner();
        setIsMinted(true);

        //mint nft
        await nft.connect(signer).mint(ipfsURL)
        message.success("NFT minted successfully !", 1);
        setIsMinted(false);
        console.log('nft minted successfully');

        setName("");
        setDescription("");

      }
    }
  }

  return (
    <div className="App">
      <div className="navbar">
        <div className="logo">
            <Avatar src={logo} size={60}/>
            <h1 className="title">GENERATE & MINT NFT</h1>
        </div>
        <div>
          {
            !wallet ? 
                <Button onClick={handleConnectWallet} type="primary" shape="round" size='large' style={{}}>
                  <Avatar src={walletLogo} size={20} style={{marginRight: "10px", marginBottom:"3px", zIndex: "1"}}/>Connect Wallet
                </Button>
            :   <Button style={{borderColor: "#f2e604"}}>
                    <Typography style={{color: '#f2e604', fontWeight:"bold"}}>{wallet?.address} | <Avatar src={bnb} size={22} style={{marginBottom:"3px", zIndex: "1"}}/> {wallet?.balance.toFixed(4)}</Typography>
                </Button>
          }  
        </div>
      </div>
    <div className='container'>
      <Card className="card">
          <div className="body">
            <div>
                <Form className="form-group">
                  <Form.Item>
                      <div className="form-group">
                        <Typography.Text style={{fontWeight: "bolder", fontSize:"16px"}}>Name of NFT</Typography.Text>
                        <Input style={{border: '2px solid #0de2e2', marginTop: "10px", height:"60px", width: "100%"}} size="medium" placeholder="Create a name..." value={name} onChange={(e)=> setName(e.target.value)}/>
                      </div>
                  </Form.Item>
                  <Form.Item>
                      <Typography.Text style={{fontWeight: "bolder", fontSize:"16px"}}>Description of NFT</Typography.Text>
                      <Input style={{border: '2px solid #0de2e2', marginTop: "10px", height:"60px",  width: "100%"}} size="medium" placeholder="Create a description..." value={description} onChange={(e)=> setDescription(e.target.value)}/>
                  </Form.Item>
                  <Form.Item>
                    <Button onClick={handleNFT} type="primary" shape="round" size='large' style={{width: "100%", height:"60px", marginTop: "10px"}}>
                      Generate & Mint
                    </Button>
                  </Form.Item>
                </Form>
            </div>
            <div className='img'>
                <Image
                    width='320px'
                    height='100%'
                    src={`${image}`}
                    fallback="data:image/png;base64,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"
                  />
            </div>
          </div>
      </Card>
    </div>

    <div className='spin'>
      {
        isLoading && <span>Creating your image... <Spin/></span>
      }
      {
        isMinted && <span>Uploading image to ipfs and minting... <Spin/></span>
      }
    </div>
    </div>
  );
}

export default App;
