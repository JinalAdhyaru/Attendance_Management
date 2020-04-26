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
        console.log("entered student");
        var sqls = 'SELECT * FROM student WHERE sid = ? AND spaswrd = ?';
        connection.query(sqls, [userid, password], function (err, result) {
        if (err) throw err;
        if(result.length==0)
        {
            response.send("student not found");
        }
        else{
        console.log("found student");
        connection.query("select sname from student where sid= '"+ userid + "'", function (err,result1) {   
            if (err) throw err;
            if(result1.length == 0) {
                response.send("error");
            }
            else {
               // console.log(result1);
            }

      });
      response.render('student',{studentname: result[0].sname});
        }
    });
    }
    else if(userid.includes("F")){
         console.log("entered faculty");
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
                    console.log(result2);
                    connection.query("SELECT course.cname FROM course natural join faculty where fid = '"+ userid + "'", function (err, result1) {
                        if (err) throw err;
                        //console.log(f);  
                        if(result1.length==0)
                        {
                        response.send("no course");
                        }           
                      else {
                          console.log(result1);
                          obj.facname = result2;
                          obj.users = result1;                
                      }
                    });            
                }
            });           
            response.render('home',obj);
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
    console.log(subject);
    connection.query("select course.cid ,course.cname,faculty.fid,faculty.fname from course natural join faculty where cname= '" + subject + "'", function(err,result) {
        console.log(result);
        connection.query("select sid from student" , function(err,result2) {
            console.log(result2);
            obj2.print = result;
        obj2.sn = result2;
        })
        
        res.render('attend',obj2);
    })

});

app.post('/lastpage', function (req ,res) {    
    const d = new Date();
    const ye = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(d)
    const mo = new Intl.DateTimeFormat('en', { month: 'long' }).format(d)
    const da = new Intl.DateTimeFormat('en', { day: 'numeric' }).format(d)

    var dayy = `${da}_${mo}_${ye}`;
    //console.log(dayy);


    var attended = req.body.selectpick;
    var sids = req.body.sid;
    var cid = req.body.cid;
    var cn = cid + "_attendance";
    // var fid = request.body.fid;
    console.log(sids.length);
    console.log(cn);
    console.log(dayy);
    connection.query("alter table "+ cn + " add cloumn "+ dayy +" int" , function(err, result) {
        if (err) throw err;
        if(result.length == 0)
        {
            console.log(result);
        }
        else {
            for (var i = 0; i < sids.length; i++) {
                var atsql = "update table "+ cn + " set "+ dayy + "= ? where sid = ?" ;
                connection.query(atsql, [attended[i]] , sids[i], function (err, result) {
                    if (err) throw err;
                    console.log("record inserted successfully");
                });
        
            }
        }
    });
});

app.post('/attendance',function(request,response){
     console.log(request.body.selectpick);
     var crname = request.body.selectpick;
     var stdn = request.body.studentname;
     console.log(crname);
     
     var tbname = crname+"_attendance";
     console.log(stdn);
     console.log(tbname);
    //  connection.query("select * from "+ tbname + "where sid=")   
});

app.listen(3000, function() {
    console.log("Server started on port 3000");
});

