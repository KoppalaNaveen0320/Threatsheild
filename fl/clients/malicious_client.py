import flwr as fl
import torch
import numpy as np
from fl.clients.client import ThreatShieldClient, IntrusionDetectionNet, load_dummy_data

class MaliciousClient(ThreatShieldClient):
    def fit(self, parameters, config):
        # 1. Start with standard training (or skip and just poison)
        self.set_parameters(parameters)
        
        # 2. Add random noise / poison to the gradients
        # We will heavily skew the weights to simulate a model poisoning attack
        poisoned_parameters = []
        for p in self.get_parameters({}):
            noise = np.random.normal(0, 5.0, p.shape) # High variance noise
            poisoned_parameters.append(p + noise)
            
        self.set_parameters(poisoned_parameters)
        
        # In a real attack, we would flip labels or inject backdoors.
        # This naive noise injection should be caught by the Trust-Weighted FedAvg (Anomaly detection).
        
        return self.get_parameters({}), len(self.trainloader.dataset), {}

def main():
    model = IntrusionDetectionNet()
    trainloader, testloader = load_dummy_data()
    
    # 20% of data is poisoned
    client = MaliciousClient(model, trainloader, testloader)
    fl.client.start_numpy_client(server_address="127.0.0.1:8080", client=client)

if __name__ == "__main__":
    main()
