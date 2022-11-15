# chainlink-hack-fall-22-0x2a-team-contracts

Package Tests  
constructor  
✓ Initialize packageTracker correctly  
setManager  
✓ reverted if called by not owner  
✓ manager is setted correctly (48057 gas)  
resetManager  
✓ reverted if called by not owner  
✓ manager is resetted correctly (26180 gas)  
setProducer  
✓ reverted if called by not manager  
✓ producer is setted correctly (96170 gas)  
resetProducer  
✓ reverted if called by not manager  
✓ producer is setted correctly (26236 gas)  
setSupplier  
✓ reverted if called by not manager  
✓ Supplier is setted correctly (96094 gas)  
resetSupplier  
✓ reverted if called by not manager  
✓ Supplier is setted correctly (26136 gas)  
token  
not minted token  
✓ token state not minted  
mintNft  
✓ reverted if called by not producer  
✓ producer can request mint (97306 gas)  
✓ packageTracker recieve random number and mint token (280080 gas)  
✓ token state is minted (182774 gas)  
setProductionTimestamp  
✓ reverted if caller is not the producer  
✓ reverted if token is not minted  
✓ production timestamp claimed (333314 gas)  
setInStockTimestamp  
✓ reverted if caller is not the supplier  
✓ reverted if token is not minted  
✓ in stock timestamp claimed (386547 gas)  
setSoldTimestamp  
✓ reverted if caller is not the supplier  
✓ reverted if token is not minted  
✓ sold timestamp claimed after production (408740 gas)  
✓ sold timestamp claimed after move in stock (106524 gas)  
28 passing (29s)
