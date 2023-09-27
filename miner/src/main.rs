use hex_literal::hex;
use rand::Rng;
use sha3::{Digest, Keccak256};
use hex::encode;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread;

const LEAD: [u8; 3] = hex!("001ead");
const GOLD: [u8; 3] = hex!("00901d");

fn mine_salt(stop_flag: Arc<AtomicBool>) -> Option<([u8; 32], [u8; 32])> {
    let mut hasher = Keccak256::new();
    let bytecode = hex!(
            "608060405234801561001057600080fd5b506004361061002b5760003560e01c"
            "806383197ef0146100d8575b600036606073"
            "C203e79F4Eec7CF5933d8c62C6a9772e50518092"
            "6001600160a01b031663eea32eb26040518163ffffffff1660e0"
            "1b8152600401602060405180830381865afa158015610082573d6000803e3d60"
            "00fd5b505050506040513d601f19601f820116820180604052508101906100a6"
            "91906100e0565b604080516001600160e01b0319909216602083015201604051"
            "6020818303038152906040529050915050805190602001f35b6100de33ff5b00"
            "5b6000602082840312156100f257600080fd5b81516001600160e01b03198116"
            "811461010a57600080fd5b939250505056fea2646970667358221220a12ccf63"
            "17029c40f1b4aa2177fefb847f4915ff863a1e2079f724b968160f6e64736f6c"
            "63430008150033"
            "00"
    );
    let mut rng = rand::thread_rng();

    loop {
        if stop_flag.load(Ordering::Relaxed) {
            return None;
        }

        let salt = rng.gen::<[u8; 32]>();
        let mut concatenated: [u8; 360] = [0; 360];
        concatenated[..328].copy_from_slice(&bytecode);
        concatenated[328..360].copy_from_slice(&salt);
        hasher.update(concatenated);
        let result = hasher.finalize_reset();

        if &result[0..3] == &LEAD {
            return Some((salt, result.into()));
        }
    }
}

fn main() {
    let stop_flag = Arc::new(AtomicBool::new(false));

    let threads: Vec<_> = (0..8).map(|_| {
        let stop_flag = stop_flag.clone();
        thread::spawn(move || mine_salt(stop_flag))
    }).collect();

    let mut result_found = false;
    for t in threads {
        if let Some((salt, result)) = t.join().unwrap() {
            println!("Salt: {}", encode(salt));
            println!("Hash: {}", encode(result));
            stop_flag.store(true, Ordering::Relaxed);
            result_found = true;
            break;
        }
    }

    if !result_found {
        println!("Failed to find a matching salt.");
    }
}
