exports.handler = async (event, context, callback) => {
    const AWS = require('aws-sdk');
    const db = new AWS.DynamoDB.DocumentClient({region: "us-west-2"});
    const words = require('./words.js');
    let numbers = [["0"], ["1"], ["A", "B", "C"], ["D", "E", "F"], ["G", "H", "I"], ["J", "K", "L"], ["M", "N", "O"], ["P", "Q", "R", "S"], ["T", "U", "V"], ["W", "X", "Y", "Z"]];
    wordlist = words.words;
    let phone = event['Details']['ContactData']['CustomerEndpoint'].Address.substring(2);
    let tableName = process.env.TABLE_NAME
    let subset = [];
    wordlist.forEach((word) => {
        if (wordlist.length > 2 && word.length < 6) {
            subset.push(word);
        }
    });

    let gparams = {
        Key: {
            "phone": phone
        },
        TableName: tableName
    };

    let returnMess = "";
    returnMess = await db.get(gparams).promise();

    if (typeof returnMess.Item !== 'undefined') {
        console.log("RM@", returnMess.Item.message);
        return returnMess.Item.message;
    }

    const combine = ([head, ...[headTail, ...tailTail]]) => {
        if (!headTail) return head;
        const combined = headTail.reduce((acc, x) => {
            return acc.concat(head.map(h => `${h}${x}`))
        }, [])
        return combine([combined, ...tailTail])
    }

    function preVowel(str) {
        let count = 0;
        for (let i = 0; i < str.length; i++) {
            if (str[i] == 2 || str[i] == 3 || str[i] == 4 || str[i] == 6 || str[i] == 8) {
                count++;
            }
        }
        return count;
    }

    function countVowels(str) {
        var count = 0;
        for (var i = 0; i < str.length; i++) {
            if (isVowel(str[i])) {
                ++count;
            }
        }
        return count
    }

    function isVowel(ch) {
        ch = ch.toUpperCase();
        return ch == "A" || ch == "E" || ch == "I" || ch == "O" || ch == "U";
    }

    let vowelPotential = preVowel(phone);
    let res = combine([numbers[phone[0]], numbers[phone[1]], numbers[phone[2]], numbers[phone[3]], numbers[phone[4]], numbers[phone[5]], numbers[phone[6]], numbers[phone[7]], numbers[phone[8]], numbers[phone[9]]])
    let count = 0;
    let resarray = []
    let rr = 0
    let message = ""
    if (vowelPotential > 4) {
        for (let i = 0; i < res.length; i++) {
            rr = countVowels(res[i]);
            if (rr >= (vowelPotential - 1)) {
                let incount = 0;
                wordlist.forEach((word) => {
                    let score = 0
                    let inarray = []
                    // if (word.length > biggestword) {
                    if (res[i].replace('0', "O").includes(word.toUpperCase())) {
                        incount++;
                        score = (word.length * 15) + (incount * 4) + (countVowels(res[i])) //+ (syllable(res[i]))
                        inarray = [score, res[i]]
                        resarray.push(inarray)
                        count++;
                    }
                })
            }
        }
        message = {
            "message": "Great, your phone number as vowels. We should get good results.",
            "resone": resarray[0][1],
            "restwo": resarray[1][1],
            "resthree": resarray[2][1]
        }
    } else {
        console.log("No Vowels");
        resarray[0] = phone.replace(/5/g, ' L').replace(/7/g, ' P').replace(/9/g, ' Y').replace(/3/g, ' E').replace(/2/g, ' A').replace(/4/g, ' I').replace(/6/g, ' O').replace(/8/g, ' U').replace(/0/g, ' 0')
        resarray[1] = phone.replace(/5/g, ' L').replace(/7/g, ' S').replace(/9/g, ' Y').replace(/3/g, ' E').replace(/2/g, ' A').replace(/4/g, ' I').replace(/6/g, ' O').replace(/8/g, ' U').replace(/0/g, ' 0')
        resarray[2] = phone.replace(/5/g, ' K').replace(/7/g, ' P').replace(/9/g, ' Y').replace(/3/g, ' E').replace(/2/g, ' A').replace(/4/g, ' I').replace(/6/g, ' O').replace(/8/g, ' U').replace(/0/g, ' 0')
        resarray[3] = phone.replace(/5/g, ' K').replace(/7/g, ' P').replace(/9/g, ' X').replace(/3/g, ' E').replace(/2/g, ' A').replace(/4/g, ' I').replace(/6/g, ' O').replace(/8/g, ' U').replace(/0/g, ' 0')
        resarray[4] = phone.replace(/5/g, ' J').replace(/7/g, ' R').replace(/9/g, ' X').replace(/3/g, ' E').replace(/2/g, ' A').replace(/4/g, ' I').replace(/6/g, ' O').replace(/8/g, ' U').replace(/0/g, ' 0')
        message = {
            "message": "Bummer, your phone number has few or no vowels. We will try our best.",
            "resone": resarray[0],
            "restwo": resarray[1],
            "resthree": resarray[2]
        }

    }
    resarray.sort(function (a, b) {
        return b[0] - a[0]
    });
    resarray.length = 5;
    var params = {
        Item: {
            "phone": phone,
            "data": resarray,
            "message": message
        },
        TableName: tableName
    }
    await db.put(params).promise();
    return message;
}