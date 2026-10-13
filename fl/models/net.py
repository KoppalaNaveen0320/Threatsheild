import torch
import torch.nn as nn

class IntrusionDetectionNet(nn.Module):
    def __init__(self, input_dim=78): # Example input dimension for CIC-IDS2017
        super(IntrusionDetectionNet, self).__init__()
        self.fc1 = nn.Linear(input_dim, 128)
        self.relu1 = nn.ReLU()
        self.fc2 = nn.Linear(128, 64)
        self.relu2 = nn.ReLU()
        self.fc3 = nn.Linear(64, 2) # Binary classification: Normal vs Malicious

    def forward(self, x):
        out = self.fc1(x)
        out = self.relu1(out)
        out = self.fc2(out)
        out = self.relu2(out)
        out = self.fc3(out)
        return out
