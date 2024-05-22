import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import { Button, Card, Input, Radio } from 'antd';

const walletName = 'unisat'; //"chainbow"
const defaultNetwork = 'livenet'; //"BTClivenet"

// const walletName = "chainbow";
// const defaultNetwork = "BTClivenet";

function App() {
  const [chainbowInstalled, setChainBowInstalled] = useState(false);
  const [connected, setConnected] = useState(false);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [publicKey, setPublicKey] = useState('');
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState({
    confirmed: 0,
    unconfirmed: 0,
    total: 0,
  });
  const [network, setNetwork] = useState(defaultNetwork);

  const getBasicInfo = async () => {
    const chainbow = (window as any)[walletName];
    const [address] = await chainbow.getAccounts();
    setAddress(address);

    const publicKey = await chainbow.getPublicKey();
    setPublicKey(publicKey);

    const balance = await chainbow.getBalance();
    setBalance(balance);

    const network = await chainbow.getNetwork();
    setNetwork(network);
  };

  const handleAccountsChanged = (_accounts: string[]) => {
    if (accounts.length > 0 && accounts[0] === _accounts[0]) {
      // prevent from triggering twice
      return;
    }
    if (_accounts.length > 0) {
      setAccounts(_accounts);
      setConnected(true);

      setAddress(_accounts[0]);

      getBasicInfo();
    } else {
      setConnected(false);
    }
  };

  const connect = async () => {
    console.log('🚀 ~ connect ~ chainbowInstalled:', chainbowInstalled);
    if (!chainbowInstalled) return;

    chainbow.requestAccounts().then((accounts: string[]) => {
      // chainbow.getAccounts().then((accounts: string[]) => {
        console.log('🚀 ~ chainbow.getAccounts ~ accounts:', accounts);
        handleAccountsChanged(accounts);
      // });
    });
  };

  const disconnect = () => {
    chainbow.removeListener('accountsChanged', handleAccountsChanged);
    chainbow.removeListener('networkChanged', handleNetworkChanged);

    setConnected(false);
    setAccounts([]);
    setPublicKey('');
    setAddress('');
    setBalance({
      confirmed: 0,
      unconfirmed: 0,
      total: 0,
    });
    setNetwork(defaultNetwork);
  };

  const handleNetworkChanged = (network: string) => {
    setNetwork(network);
    getBasicInfo();
  };

  const checkChainBow = async () => {
    let chainbow = (window as any)[walletName];

    for (let i = 1; i < 10 && !chainbow; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 100 * i));
      chainbow = (window as any)[walletName];
    }

    if (chainbow) {
      //应该保存到数据库，记录下来已经登录了，下次自动登录
      setChainBowInstalled(true);
      chainbow.on('accountsChanged', handleAccountsChanged);
      chainbow.on('networkChanged', handleNetworkChanged);
    }
    return chainbow;
  };

  useEffect(() => {
    checkChainBow().then((chainbow) => {
      if (chainbow) {
        // //TODO：检查数据库是否链接过本网站，看session是否已经过期，如果没有过期，链接钱包
        connect();
      }
    });
  }, []);

  if (!chainbowInstalled) {
    return (
      <div className="App">
        <header className="App-header">
          <div>
            <Button
              onClick={() => {
                window.location.href = 'https://chainbow.io';
              }}
            >
              Install ChainBow Wallet
            </Button>
          </div>
        </header>
      </div>
    );
  }
  const chainbow = (window as any)[walletName];
  return (
    <div className="App">
      <header className="App-header">
        <p>ChainBow Wallet Demo</p>

        {connected ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div>
              <Button
                onClick={async () => {
                  await disconnect();
                }}
              >
                Disconnect
              </Button>
            </div>

            <Card
              size="small"
              title="Basic Info"
              style={{ width: 300, margin: 10 }}
            >
              <div style={{ textAlign: 'left', marginTop: 10 }}>
                <div style={{ fontWeight: 'bold' }}>Address:</div>
                <div style={{ wordWrap: 'break-word' }}>{address}</div>
              </div>

              <div style={{ textAlign: 'left', marginTop: 10 }}>
                <div style={{ fontWeight: 'bold' }}>PublicKey:</div>
                <div style={{ wordWrap: 'break-word' }}>{publicKey}</div>
              </div>

              <div style={{ textAlign: 'left', marginTop: 10 }}>
                <div style={{ fontWeight: 'bold' }}>Balance: (Satoshis)</div>
                <div style={{ wordWrap: 'break-word' }}>{balance.total}</div>
              </div>
            </Card>

            <Card
              size="small"
              title="Switch Network"
              style={{ width: 300, margin: 10 }}
            >
              <div style={{ textAlign: 'left', marginTop: 10 }}>
                <div style={{ fontWeight: 'bold' }}>Network:</div>
                <Radio.Group
                  onChange={async (e) => {
                    const network = await chainbow.switchNetwork(
                      e.target.value
                    );
                    setNetwork(network);
                  }}
                  value={network}
                >
                  <Radio value={'BTClivenet'}>BTClivenet</Radio>
                  <Radio value={'BTCtestnet'}>BTCtestnet</Radio>
                  <Radio value={'BSVlivenet'}>BSVlivenet</Radio>
                  <Radio value={'BSVtestnet'}>BSVtestnet</Radio>
                  <Radio value={'RXDlivenet'}>RXDlivenet</Radio>
                  <Radio value={'RXDtestnet'}>RXDtestnet</Radio>
                </Radio.Group>
              </div>
            </Card>

            <SignPsbtCard />
            <SignMessageCard />
            <PushTxCard />
            <PushPsbtCard />
            <SendBitcoin />
          </div>
        ) : (
          <div>
            <Button
              onClick={async () => {
                await connect();
              }}
            >
              Connect ChainBow Wallet
            </Button>
          </div>
        )}
      </header>
    </div>
  );
}

function SignPsbtCard() {
  const [psbtHex, setPsbtHex] = useState('');
  const [psbtResult, setPsbtResult] = useState('');
  return (
    <Card size="small" title="Sign Psbt" style={{ width: 300, margin: 10 }}>
      <div style={{ textAlign: 'left', marginTop: 10 }}>
        <div style={{ fontWeight: 'bold' }}>PsbtHex:</div>
        <Input
          defaultValue={psbtHex}
          onChange={(e) => {
            setPsbtHex(e.target.value);
          }}
        ></Input>
      </div>
      <div style={{ textAlign: 'left', marginTop: 10 }}>
        <div style={{ fontWeight: 'bold' }}>Result:</div>
        <div style={{ wordWrap: 'break-word' }}>{psbtResult}</div>
      </div>
      <Button
        style={{ marginTop: 10 }}
        onClick={async () => {
          try {
            const psbtResult = await (window as any)[walletName].signPsbt(
              psbtHex
            );
            setPsbtResult(psbtResult);
          } catch (e) {
            setPsbtResult((e as any).message);
          }
        }}
      >
        Sign Psbt
      </Button>
    </Card>
  );
}

function SignMessageCard() {
  const [message, setMessage] = useState('hello world~');
  const [signature, setSignature] = useState('');
  return (
    <Card size="small" title="Sign Message" style={{ width: 300, margin: 10 }}>
      <div style={{ textAlign: 'left', marginTop: 10 }}>
        <div style={{ fontWeight: 'bold' }}>Message:</div>
        <Input
          defaultValue={message}
          onChange={(e) => {
            setMessage(e.target.value);
          }}
        ></Input>
      </div>
      <div style={{ textAlign: 'left', marginTop: 10 }}>
        <div style={{ fontWeight: 'bold' }}>Signature:</div>
        <div style={{ wordWrap: 'break-word' }}>{signature}</div>
      </div>
      <Button
        style={{ marginTop: 10 }}
        onClick={async () => {
          const signature = await (window as any)[walletName].signMessage(
            message
          );
          setSignature(signature);
        }}
      >
        Sign Message
      </Button>
    </Card>
  );
}

function PushTxCard() {
  const [rawtx, setRawtx] = useState('');
  const [txid, setTxid] = useState('');
  return (
    <Card
      size="small"
      title="Push Transaction Hex"
      style={{ width: 300, margin: 10 }}
    >
      <div style={{ textAlign: 'left', marginTop: 10 }}>
        <div style={{ fontWeight: 'bold' }}>rawtx:</div>
        <Input
          defaultValue={rawtx}
          onChange={(e) => {
            setRawtx(e.target.value);
          }}
        ></Input>
      </div>
      <div style={{ textAlign: 'left', marginTop: 10 }}>
        <div style={{ fontWeight: 'bold' }}>txid:</div>
        <div style={{ wordWrap: 'break-word' }}>{txid}</div>
      </div>
      <Button
        style={{ marginTop: 10 }}
        onClick={async () => {
          try {
            const txid = await (window as any)[walletName].pushTx(rawtx);
            setTxid(txid);
          } catch (e) {
            setTxid((e as any).message);
          }
        }}
      >
        PushTx
      </Button>
    </Card>
  );
}

function PushPsbtCard() {
  const [psbtHex, setPsbtHex] = useState('');
  const [txid, setTxid] = useState('');
  return (
    <Card size="small" title="Push Psbt Hex" style={{ width: 300, margin: 10 }}>
      <div style={{ textAlign: 'left', marginTop: 10 }}>
        <div style={{ fontWeight: 'bold' }}>psbt hex:</div>
        <Input
          defaultValue={psbtHex}
          onChange={(e) => {
            setPsbtHex(e.target.value);
          }}
        ></Input>
      </div>
      <div style={{ textAlign: 'left', marginTop: 10 }}>
        <div style={{ fontWeight: 'bold' }}>txid:</div>
        <div style={{ wordWrap: 'break-word' }}>{txid}</div>
      </div>
      <Button
        style={{ marginTop: 10 }}
        onClick={async () => {
          try {
            const txid = await (window as any)[walletName].pushPsbt(psbtHex);
            setTxid(txid);
          } catch (e) {
            setTxid((e as any).message);
          }
        }}
      >
        pushPsbt
      </Button>
    </Card>
  );
}

function SendBitcoin() {
  const [toAddress, setToAddress] = useState(
    'bc1qm9dzdq4x20xsu7apgkx057a7v83rkzysk5lq0z'
  );
  const [satoshis, setSatoshis] = useState(1000);
  const [txid, setTxid] = useState('');
  return (
    <Card size="small" title="Send Bitcoin" style={{ width: 300, margin: 10 }}>
      <div style={{ textAlign: 'left', marginTop: 10 }}>
        <div style={{ fontWeight: 'bold' }}>Receiver Address:</div>
        <Input
          defaultValue={toAddress}
          onChange={(e) => {
            setToAddress(e.target.value);
          }}
        ></Input>
      </div>

      <div style={{ textAlign: 'left', marginTop: 10 }}>
        <div style={{ fontWeight: 'bold' }}>Amount: (satoshis)</div>
        <Input
          defaultValue={satoshis}
          onChange={(e) => {
            setSatoshis(parseInt(e.target.value));
          }}
        ></Input>
      </div>
      <div style={{ textAlign: 'left', marginTop: 10 }}>
        <div style={{ fontWeight: 'bold' }}>txid:</div>
        <div style={{ wordWrap: 'break-word' }}>{txid}</div>
      </div>
      <Button
        style={{ marginTop: 10 }}
        onClick={async () => {
          try {
            const txid = await (window as any)[walletName].sendBitcoin(
              toAddress,
              satoshis
            );
            setTxid(txid);
          } catch (e) {
            setTxid((e as any).message);
          }
        }}
      >
        SendBitcoin
      </Button>
    </Card>
  );
}

export default App;
