import bcrypt

password = "password123"
salt = bcrypt.gensalt()
hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
print("Raw hashed bytes:", hashed)

hashed_str = hashed.decode('utf-8')
print("Decoded hashed str:", hashed_str)

# Verify
match = bcrypt.checkpw(password.encode('utf-8'), hashed_str.encode('utf-8'))
print("Check match status:", match)
