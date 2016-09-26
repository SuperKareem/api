
var good = ({msg, data}) => {
  let dataShape = {
      errors: 0,
      res: {
        msg: '',
        data: {}
      }
    }
   !!!msg ? msg = 'Good!' : null
   !!!data ? data = {} : null
   dataShape.res.msg = msg;
   dataShape.res.data = data;
   return dataShape;
}
var bad = ({errors, data}) =>{
  let dataShape = {
      errors: 0,
      res: {
        msg: '',
        data: {}
      }
    }
  !!!errors ? errors = 1 : null
  !!!data ? data = 'Bad !' : null
  dataShape.errors = errors.length
  dataShape.res.data = data
  dataShape.res.msg = errors
  return dataShape;
}

export default {
  ok: good,
  fail: bad
}
