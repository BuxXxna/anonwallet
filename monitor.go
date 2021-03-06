package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"strconv"
	"time"
)

type BitcoinAddressMonitor struct {
}

func (b *BitcoinAddressMonitor) start() {
	go func() {
		for {
			time.Sleep(time.Second * 5)

			b.checkAddresses()
		}
	}()
}

func (b *BitcoinAddressMonitor) checkAddresses() {
	var users []*User
	db.Find(&users)

	for _, u := range users {
		balance := b.checkAddressesRequest(u.BitcoinAddr)
		amountNew := balance - u.BitcoinBalanceProcessed
		if amountNew > 100000 {
			u.BitcoinBalanceNew = amountNew
			db.Save(u)
		}
	}
}

func (b *BitcoinAddressMonitor) checkAddressesRequest(address string) int {
	if len(address) == 0 {
		return 0
	}

	cl := http.Client{}

	url := fmt.Sprintf("https://blockchain.info/q/addressbalance/%s?confirmations=1", address)

	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		log.Printf("[BitcoinAddressMonitor.checkAdressesRequest] request err %s", err)
		return 0
	}

	res, err := cl.Do(req)
	if err != nil {
		log.Printf("[BitcoinAddressMonitor.checkAdressesRequest] request do err %s", err)
		return 0
	}
	body, _ := ioutil.ReadAll(res.Body)

	balance, err := strconv.Atoi(string(body))
	if err == nil {
		return balance
	} else {
		log.Printf("[BitcoinAddressMonitor.checkAdressesRequest] strconv err: %s", err)
	}

	return 0
}

func initBaMonitor() *BitcoinAddressMonitor {
	bam := &BitcoinAddressMonitor{}
	bam.start()
	return bam
}

type EthereumAddressMonitor struct {
}

func (e *EthereumAddressMonitor) start() {
	go func() {
		for {
			time.Sleep(time.Second * 5)

			e.checkAddresses()
		}
	}()
}

func (e *EthereumAddressMonitor) checkAddresses() {
	var users []*User
	db.Find(&users)

	for _, u := range users {
		balance := e.checkAddressesRequest(u.EtherAddr)
		amountNew := balance - u.EtherBalanceProcessed
		if amountNew > 100000 {
			u.EtherBalanceNew = amountNew
			db.Save(u)
		}
	}
}

func (e *EthereumAddressMonitor) checkAddressesRequest(address string) int {
	if len(address) == 0 {
		return 0
	}

	cl := http.Client{}

	url := fmt.Sprintf("https://api.etherscan.io/api?module=account&action=balance&tag=latest&address=%s", address)

	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		log.Printf("[EthereumAddressMonitor.checkAdressesRequest] request err %s", err)
		return 0
	}

	res, err := cl.Do(req)
	if err != nil {
		log.Printf("[EthereumAddressMonitor.checkAdressesRequest] request do err %s", err)
		return 0
	}
	body, err := ioutil.ReadAll(res.Body)
	if err != nil {
		log.Printf("[EthereumAddressMonitor.checkAdressesRequest] ioutil.ReadAll err %s", err)
		return 0
	}

	b := &EthBalance{}

	json.Unmarshal(body, b)

	balance, err := strconv.Atoi(b.Result)
	if err != nil {
		return 0
	}

	return balance / 10000000000
}

func initEaMonitor() *EthereumAddressMonitor {
	eam := &EthereumAddressMonitor{}
	eam.start()
	return eam
}

type EthBalance struct {
	Status  string `json:"status"`
	Message string `json:"message"`
	Result  string `json:"result"`
}
