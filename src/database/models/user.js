const database = require('../database');
const Schema = database.Schema;
const _ = require('lodash');
import bcrypt from 'bcrypt';
import isEmail from 'validator/lib/isEmail';

const userSchema = new Schema({
    username: {
        type: String,
        unique: false,
        required: true,
    },
    email: {
        type: String,
        unique: true,
        required: true,
        validate: [isEmail, 'No valid email address provided.'],
    },
    password: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 42,
    },
    session: [{
        token: {
            type: String,
            required: true
        },
        expiresAt: {
            type: String,
            required: true
        }
    }],
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    }
}, { timestamps: true });

const jwtSecret = "zilker";

/**
 * Override the default toJSON method
 * To omit the password and session in the returned object
 * return the document except the password and sessions (these shouldn't be made available)
 */
userSchema.methods.toJSON = function() {
    const user = this;
    const userObject = user.toObject();

    return _.omit(userObject, ['password', 'session']);
}

// to remove
userSchema.statics.findByLogin = async function(login) {
    let user = await this.findOne({
        username: login,
    });

    if (!user) {
        user = await this.findOne({ email: login });
    }

    return user;
};

/**
 * Search user by User id and refresh token
 */
userSchema.statics.findByIdAndToken = function(_id, token) {
    const user = this;
    return user.findOne({
        _id,
        'session.token': token
    });
}

/**
 * Find the  user in DB using the email and password
 */
userSchema.statics.findUserByCredentials = function(email, password) {
    let user = this;
    return user.findOne({ email }).then((user) => {
        if (!user) {
            return Promise.reject();
        }
        return new Promise((resolve, reject) => {
            bcrypt.compare(password, user.password, (error, result) => {
                if (result) {
                    resolve(user);
                } else {
                    reject();
                }
            });
        });
    });
}

/**
 * Check if the RefreshToken in DB is expired
 */
userSchema.statics.hasRefreshTokenExpired = (expireAt) => {
    let secondsSince = Date.now() / 1000;
    if (expireAt > secondsSince) {
        return false; // hasn't expired
    }
    return true; //has expired
}

// to remove
userSchema.pre('remove', function(next) {
    this.model('Message').deleteMany({ userId: this._id }, next);
});

/**
 * Middleware
 * Before the user document is saved
 */
userSchema.pre('save', function(next) {
    const user = this;
    const constFactor = 10;

    if (user.isModified('password')) {
        //if the password is changed/ editing run this code
        bcrypt.genSalt(constFactor, (error, salt) => {
            bcrypt.hash(user.password, salt, (error, hash) => {
                user.password = hash;
                next();
            })
        })
    } else {
        next();
    }

});

/**
 * To generate the JWT token
 * use promise to occur in sysnchronous way
 *  Create the JSON Web Token and return that
 */
userSchema.methods.generateAccessAuthToken = function() {
    const user = this;
    // toHexString -> string return the 24 byte hex string representation.
    return new Promise((resolve, reject) => {
        jwt.sign({ _id: user._id.toHexString() }, jwtSecret, { expiresIn: '15m' }, (error, token) => {
            if (!error) {
                resolve(token);
            } else {
                reject(error);
            }
        });
    });
}

/**
 * Generate the refresh token
 */
userSchema.methods.generateRefreshAuthToken = function() {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(64, (error, buffer) => {
            if (!error) {
                let token = buffer.toString('hex');
                return resolve(token);
            } else {
                reject(error);
            }
        });
    });
}

/**
 * To create a refresh session
 * and store in DB
 */
userSchema.methods.createSession = function() {
    const user = this;
    return user.generateRefreshAuthToken().then(refreshToken => {
        return saveSessionToDatabase(user, refreshToken);
    }).then(refreshToken => {
        return refreshToken;
    }).catch(error => {
        return Promise.reject('Failed to save session to database.\n' + error);
    });
}

/**
 * Static methods (MODEL methods)
 * Called on model not an instance of the model
 */
userSchema.statics.getJWTSecret = () => {
    return jwtSecret;
}

// need to remove
userSchema.methods.generatePasswordHash = async function() {
    const saltRounds = 10;
    return await bcrypt.hash(this.password, saltRounds);
};

userSchema.methods.validatePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

const User = database.model('User', userSchema);

export default User;