-- Seed the login table with default user
INSERT INTO login (username, password_hash, email) 
VALUES ('ragul@gmail.com', 'password', 'ragul@gmail.com') 
ON CONFLICT (username) DO NOTHING;
