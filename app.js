var express= require('express');
var bodyParser= require('body-parser');
var mysql = require('mysql');
var session = require('express-session');
var path = require('path');

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'attendance_management'
});

var app = express();

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));


app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.set('view engine', 'ejs');

app.get("/", function(req, res) {
    res.sendFile(path.join(__dirname + "/views/index.html"));
});

var obj = {};
var obj3 = {};
app.post("/auth", function (request, response) {
    var userid = request.body.usrname;
    var password = request.body.password;

    //console.log(userid);
    //console.log(password);
    if(userid.includes("2018500")){
        //console.log("entered student");
        var sqls = 'SELECT * FROM student WHERE sid = ? AND spaswrd = ?';
        connection.query(sqls, [userid, password], function (err, result) {
        if (err) throw err;
        if(result.length==0)
        {
            response.send("student not found");
        }
        else{
        //console.log("found student");
        connection.query("select sname from student where sid= '"+ userid + "'", function (err,result1) {   
            if (err) throw err;
            if(result1.length == 0) {
                response.send("error");
            }
            else {
               // console.log(result1);
               response.render('student',{studentname: result[0].sname});
            }

      });
      
        }
    });
    }
    else if(userid.includes("F")){
        // console.log("entered faculty");
        var sqlf = 'SELECT * FROM faculty WHERE fid = ? AND fpaswrd = ?';
    connection.query(sqlf, [userid, password], function (err, result) {
        if (err) throw err;
        if(result.length==0)
        {
            response.send("faculty not found");
        }
        else{
            connection.query("select fname from faculty where fid = '"+ userid +"'", function(err,result2) {
                if(err) throw err;
                if(result2.length == 0)
                {
                    response.send("no such faculty");
                }
                else {
                    //console.log(result2);
                    connection.query("SELECT course.cname FROM course natural join faculty where fid = '"+ userid + "'", function (err, result1) {
                        if (err) throw err;
                        //console.log(f);  
                        if(result1.length==0)
                        {
                        response.send("no course");
                        }           
                      else {
                          //console.log(result1);
                          obj.facname = result2;
                          obj.users = result1;
                          response.render('home',obj);                
                      }
                    });            
                }
            });           
           
        }        
    });
    }
    else{
        response.send("incorrect values");
    }
    
});

var obj2={};
app.post('/mark', function(req,res) {
    var subject = req.body.addattendance;
    //console.log(subject);
    connection.query("course.cid, course.cname , faculty.fid , faculty.fname , student.sid from student , course natural join faculty where cname = " + subject + "'", function(err,result) {
//        obj2 = {attend: result};
        console.log(obj2);
        obj2 = {attend: result}; 
        res.render('attend',obj2);
    })       
       
});

app.post('/lastpage', function(req,res) {
    //var lastt = request.body.selectpick;
    var date_ob = new Date();
    var date = ("0" + date_ob.getDate()).slice(-2);
    var month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    var year = date_ob.getFullYear();
    var at_date = year + "-" + month + "-" + date;
    //console.log(request.body.selectpick);
    //console.log(request.body.s_name);
    //console.log(request.body.s_id);
    //console.log(request.body.c_name);
    //console.log(request.body.c_id);
    //console.log(request.body.f_id);
    //console.log(request.body.f_name);
    var attended = request.body.selectpick;
    var sids = request.body.s_id;
    var cid = request.body.c_id;
    var fid = request.body.f_id;
    console.log(sids.length);
    for (var i = 0; i < sids.length; i++) {
        var atsql = 'insert into mark_attendance values(? ,? ,? ,? ,?)';
        connection.query(atsql, [sids[i], at_date, cid, fid, attended[i]], function (err, result) {
            if (err) throw err;
            console.log("record inserted successfully");
        });

    }
});

app.post('/attendance',function(request,response){
     console.log(request.body.selectpick);
});

app.listen(3000, function() {
    console.log("Server started on port 3000");
});

