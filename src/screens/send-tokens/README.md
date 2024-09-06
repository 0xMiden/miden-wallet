# Send Tokens Feature Documentation

## Overview
The send tokens feature allows users to transfer tokens to other addresses or contacts within the application. This flow includes steps to ensure the user has sufficient balance, chooses the correct token and recipient, configures transaction options, reviews the transaction, and finally confirms it.

## Directory Structure
- **send-tokens**: Contains components specific to the process of sending tokens.

## Screen Flow

### No Balance
- **Path**: `send-tokens/NoBalance.tsx`
- **Description**: Informs the user that they have no balance to send tokens. The user can only navigate to the buy or transfer tokens flows from this screen.

### Choose Token
- **Path**: `send-tokens/SelectToken.tsx`
- **Description**: Allows the user to select the token they want to send, provided they have sufficient balance.

### Choose Recipient
- **Path**: `send-tokens/SelectRecipient.tsx`
- **Description**: Enables the user to select the recipient from their contacts list or manually input the recipient's address.

### Contacts List
- **Path**: `send-tokens/ContactsList.tsx`
- **Description**: Displays the user's contacts list, allowing them to choose a recipient for the token transfer.

### Transaction Options
- **Path**: `send-tokens/TransactionOptions.tsx`
- **Description**: Lets the user enter the amount in USD or tokens and choose between Private - Private, Public - Public, and Advanced transaction options. Users can also navigate to the Fee Options and Advanced Transaction Options screens from here.

### Advanced Options
- **Path**: `send-tokens/AdvancedOptions.tsx`
- **Description**: Provides the user with the option to change the transaction type to Private - Public, Public - Private, Public - Public, or Private - Private.

### Fee Options
- **Path**: `send-tokens/FeeOptions.tsx`
- **Description**: Allows the user to choose between Public and Private fee options and enter a custom fee amount.

### Review
- **Path**: `send-tokens/Review.tsx`
- **Description**: Displays the transaction details for the user to review before confirming the transaction.

### Confirmation
- **Path**: `send-tokens/Confirmation.tsx`
- **Description**: Shows the transaction confirmation screen and provides the option to navigate back to the home screen.

## Commands to generate screens

```
hygen screen new NoBalance --flow send-tokens
hygen screen new SelectToken --flow send-tokens
hygen screen new SelectRecipient --flow send-tokens
hygen screen new ContactsList --flow send-tokens
hygen screen new TransactionOptions --flow send-tokens
hygen screen new AdvancedOptions --flow send-tokens
hygen screen new FeeOptions --flow send-tokens
hygen screen new Review --flow send-tokens
hygen screen new Confirmation --flow send-tokens
```