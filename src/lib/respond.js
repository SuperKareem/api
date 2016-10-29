
var good = ({msg, data}) => {
  let dataShape = {
      errors: 0,
      res: {
        msg: '',
        data: {}
      }
    }
   !!!msg ? msg = 'good!' : null
   !!!data ? data = {} : null
   dataShape.res.msg = msg;
   dataShape.res.data = data;
   return dataShape;
}
var bad = ({msg, data}) =>{
  let dataShape = {
      errors: 1,
      res: {
        msg: !!msg ? msg : 'bad!',
        data: data
      }
    }
  return dataShape;
}

export default {
  ok: good,
  fail: bad
}
