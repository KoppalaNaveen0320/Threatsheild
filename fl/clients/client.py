import flwr as fl
import torch
import torch.nn as nn
from collections import OrderedDict
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from models.net import IntrusionDetectionNet

class ThreatShieldClient(fl.client.NumPyClient):
    def __init__(self, model, trainloader, testloader):
        self.model = model
        self.trainloader = trainloader
        self.testloader = testloader
        self.criterion = nn.CrossEntropyLoss()
        self.optimizer = torch.optim.Adam(self.model.parameters(), lr=0.001)

    def get_parameters(self, config):
        return [val.cpu().numpy() for _, val in self.model.state_dict().items()]

    def set_parameters(self, parameters):
        params_dict = zip(self.model.state_dict().keys(), parameters)
        state_dict = OrderedDict({k: torch.tensor(v) for k, v in params_dict})
        self.model.load_state_dict(state_dict, strict=True)

    def fit(self, parameters, config):
        self.set_parameters(parameters)
        self.model.train()
        for epoch in range(1): # Local epochs
            for data, target in self.trainloader:
                self.optimizer.zero_grad()
                output = self.model(data)
                loss = self.criterion(output, target)
                loss.backward()
                self.optimizer.step()
        return self.get_parameters(config={}), len(self.trainloader.dataset), {}

    def evaluate(self, parameters, config):
        self.set_parameters(parameters)
        self.model.eval()
        loss = 0.0
        correct = 0
        with torch.no_grad():
            for data, target in self.testloader:
                output = self.model(data)
                loss += self.criterion(output, target).item()
                pred = output.argmax(dim=1, keepdim=True)
                correct += pred.eq(target.view_as(pred)).sum().item()
        
        loss = loss / len(self.testloader)
        accuracy = correct / len(self.testloader.dataset)
        return loss, len(self.testloader.dataset), {"accuracy": accuracy}

def load_dummy_data(n_samples=200, n_features=78, random_state=42, shift=0.0):
    import torch.utils.data as data_utils
    from sklearn.datasets import make_classification
    
    # Create a synthetic dataset that can actually be learned
    X, y = make_classification(n_samples=n_samples, n_features=n_features, n_informative=20, 
                               n_redundant=10, random_state=random_state, n_classes=2)
    
    X = X + shift  # shift for non-IID simulation if needed
    
    features = torch.tensor(X, dtype=torch.float32)
    labels = torch.tensor(y, dtype=torch.long)
    
    dataset = data_utils.TensorDataset(features, labels)
    
    # 80% train, 20% test
    train_size = int(0.8 * len(dataset))
    test_size = len(dataset) - train_size
    train_dataset, test_dataset = data_utils.random_split(dataset, [train_size, test_size])
    
    trainloader = data_utils.DataLoader(train_dataset, batch_size=32, shuffle=True)
    testloader = data_utils.DataLoader(test_dataset, batch_size=32, shuffle=False)
    
    return trainloader, testloader

def main():
    model = IntrusionDetectionNet()
    trainloader, testloader = load_dummy_data()
    client = ThreatShieldClient(model, trainloader, testloader)
    fl.client.start_numpy_client(server_address="127.0.0.1:8080", client=client)

if __name__ == "__main__":
    main()
