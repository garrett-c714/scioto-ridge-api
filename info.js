const reserveTimes = ['11:00','11:10','11:20','11:30','11:40', '11:50', '12:00','12:10','12:20','12:30','12:40', '12:50','1:00','1:10','1:20','1:30','1:40','1:50','2:00','2:10','2:20','2:30','2:40','2:50','3:00','3:10','3:20','3:30','3:40','3:50','4:00','4:10','4:20','4:30','4:40','4:50','5:00','5:10','5:20','5:30','5:40','5:50','6:00','6:10','6:20','6:30','6:40','6:50','7:00','7:10','7:20','7:30','7:40','7:50','8:00','8:10','8:20','8:30'];

const attractions = ['Roller Coaster','Ferris Wheel','Swings','Rocket Ship','Sling Shot','Haunted Castle Ride','Parachute Drop','Merry-Go-Round','Antique Cars','Cage Ride','Train','Boats','Chuck Wagon','Dogs to Go','Chickens-R-Us','Easy as Pie Diner','Forever Cool Ice Cream'];

const cipher = salt => {
    const textToChars = text => text.split('').map(c => c.charCodeAt(0));
    const byteHex = n => ("0" + Number(n).toString(16)).substr(-2);
    const applySaltToChar = code => textToChars(salt).reduce((a,b) => a ^ b, code);

    return text => text.split('')
        .map(textToChars)
        .map(applySaltToChar)
        .map(byteHex)
        .join('');
}

const encoder = cipher('lolalynx');

module.exports = {
    reserveTimes,
    attractions,
    encoder
}