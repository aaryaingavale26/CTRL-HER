import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
import joblib

data = {
    'description': [
        'Starbucks Coffee', 'McDonalds Burger', 'Zomato Delivery', 'Swiggy Order',
        'Uber Trip', 'Ola Cabs Ride', 'Shell Gas Station', 'Local Train Ticket',
        'Netflix Monthly Subscription', 'Spotify Premium', 'IMAX Cinema Tickets',
        'Landlord Rent Payment', 'HDFC Home Loan EMI',
        'Electric Bill', 'Municipal Water Bill', 'Wi-Fi Internet Bill',
        'Salary Credit', 'Freelance Project Payout', 'Dividend Inflow'
    ],
    'category': [
        'Food', 'Food', 'Food', 'Food',
        'Transport', 'Transport', 'Transport', 'Transport',
        'Entertainment', 'Entertainment', 'Entertainment',
        'Rent', 'Rent',
        'Utilities', 'Utilities', 'Utilities',
        'Income', 'Income', 'Income'
    ]
}
df = pd.DataFrame(data)

vectorizer = TfidfVectorizer()
X = vectorizer.fit_transform(df['description'])
y = df['category']

model = LogisticRegression()
model.fit(X, y)

joblib.dump(model, 'finance_model.pkl')
joblib.dump(vectorizer, 'vectorizer.pkl')

print("🎉 AI Model and Vectorizer trained and saved successfully!")