package app.credito.shared;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.dao.DataIntegrityViolationException;
@RestControllerAdvice
public class Erros {
 @ExceptionHandler(NaoEncontrado.class) public ProblemDetail naoEncontrado(NaoEncontrado e){return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND,e.getMessage());}
 @ExceptionHandler({IllegalArgumentException.class,ArithmeticException.class}) public ProblemDetail negocio(RuntimeException e){return ProblemDetail.forStatusAndDetail(HttpStatus.UNPROCESSABLE_ENTITY,e.getMessage());}
 @ExceptionHandler(MethodArgumentNotValidException.class) public ProblemDetail validar(MethodArgumentNotValidException e){return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,e.getBindingResult().getFieldErrors().stream().map(f->f.getField()+": "+f.getDefaultMessage()).reduce((a,b)->a+"; "+b).orElse("Dados inválidos."));}
 @ExceptionHandler(DataIntegrityViolationException.class) public ProblemDetail conflito(){return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT,"Operação duplicada ou vínculo financeiro inválido. Atualize os dados.");}
}
